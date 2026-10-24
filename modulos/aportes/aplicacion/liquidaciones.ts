// @HU-COB-07
import { prisma } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { aplicarPagoAprobado } from "@/modulos/aportes/aplicacion/abono";
import { aReciboDto } from "@/modulos/aportes/aplicacion/recibos";
import { prepararLiquidacion, repartirCobro } from "@/modulos/aportes/dominio/cobro";
import { MEDIOS, textoDeSemanas } from "@/modulos/aportes/dominio/pago";
import { cuotasPorPagarDe, ultimaCuotaDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import {
  bloquearCasa,
  crearPagoPresencial,
  cuotasImpagasDe,
  pagoPorIdOperacion,
  semanasYaEnPago,
} from "@/modulos/aportes/infraestructura/repositorioPagos";
import { reciboDelPago } from "@/modulos/aportes/infraestructura/repositorioRecibos";
import { nombresDe, vigilantesParaAvisar } from "@/modulos/identidad/aplicacion/barrio";
import { buscarVecinos, casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** Una casa como la ve la directiva al ponerla al día: lo que debe, desde cuándo y si la reja se le abre sola. */
async function aCasa(predioId: string, esSuya: boolean, puedeRegistrar: boolean) {
  const [casas, cuotas, ultima] = await Promise.all([
    casasDe([predioId]),
    cuotasPorPagarDe(predioId),
    ultimaCuotaDe(predioId),
  ]);
  const casa = casas.get(predioId);
  if (!casa) throw new ErrorNoEncontrado();
  const debe = cuotas.reduce((suma, c) => suma + c.saldoPendiente, 0);
  return {
    predioId,
    vivienda: casa.vivienda,
    nombre: casa.nombre,
    debe,
    semanas: cuotas.length,
    detalle: textoDeSemanas(cuotas.map((c) => c.periodo)),
    rejaSuspendida: casa.estadoGarita === "ROJO",
    cuotaSemanal: ultima
      ? `${soles(ultima.montoCalculado)} (${ultima.conceptos.map((l) => `${minuscula(l.nombre)} ${soles(l.subtotal)}`).join(" + ")})`
      : null,
    esSuya,
    puedeRegistrar: puedeRegistrar && !esSuya && debe > 0,
  };
}

export type CasaPorPonerAlDia = Awaited<ReturnType<typeof aCasa>>;

/**
 * «Poner al día a un vecino» (DIR-COB-15): busca por nombre o DNI y muestra cada casa con lo que debe, desde cuándo y si
 * la reja se le abre sola. Registrar el pago es solo de la directiva y nunca en su propia casa. El DNI no sale entero.
 */
export async function buscarCasasPorPonerAlDia(sesion: SesionDto, texto: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const encontrados = await buscarVecinos(texto);
  const miCasa = await predioDelVecino(sesion.usuarioId);
  const predios = [...new Map(encontrados.map((e) => [e.predioId, e])).values()].slice(0, 8);
  const casas = await Promise.all(
    predios.map(async (p) => ({
      ...(await aCasa(p.predioId, p.predioId === miCasa?.id, sesion.roles.includes("DIRECTIVA"))),
      nombre: p.nombre,
      dniTerminadoEn: p.dniTerminadoEn,
    })),
  );
  return { casas };
}

/** La casa de «Registrar el pago total» (DIR-COB-16): lo mismo que la búsqueda, para una sola casa. */
export async function verCasaPorPonerAlDia(sesion: SesionDto, predioId: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const miCasa = await predioDelVecino(sesion.usuarioId);
  return aCasa(predioId, predioId === miCasa?.id, sesion.roles.includes("DIRECTIVA"));
}

/**
 * Registra el pago de toda la deuda acumulada de una casa (HU-COB-07 CA1 a CA3): lo paga en efectivo, por Yape, Plin o
 * transferencia, y la casa pasa a «Al día». En la misma transacción se aplica el abono a todas sus cuotas, se restituye
 * la garita (la reja vuelve a abrirse sola), se emite el recibo y se avisa a la casa y, si la reja estaba suspendida, a
 * la garita; todo en la auditoría (AC-6). Solo la directiva y nunca en su propia casa. Repetir el mismo `idOperacion`
 * devuelve lo ya registrado sin abonar ni avisar otra vez (AC-5). Si la casa tiene un pago en revisión, primero se resuelve.
 */
export async function liquidarDeuda(
  sesion: SesionDto,
  datos: { predioId: string; medio: string; numeroOperacion?: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  const previo = await pagoPorIdOperacion(datos.idOperacion);
  if (previo) return repetida(sesion, previo.id, previo.autorId, previo.predioId, previo.monto);
  const { errores, liquidacion } = prepararLiquidacion({
    medio: datos.medio,
    numeroOperacion: datos.numeroOperacion ?? "",
  });
  if (!liquidacion) throw new ErrorValidacion(undefined, errores);
  const miCasa = await predioDelVecino(sesion.usuarioId);
  if (datos.predioId === miCasa?.id) {
    throw new ErrorReglaNegocio("Es la deuda de su casa: la registra otro miembro de la directiva.");
  }
  const casa = (await casasDe([datos.predioId])).get(datos.predioId);
  if (!casa) throw new ErrorNoEncontrado();
  const vigilantes = casa.estadoGarita === "ROJO" ? await vigilantesParaAvisar() : [];
  const medioTexto = liquidacion.numeroOperacion
    ? `${MEDIOS[liquidacion.medio]} (operación ${liquidacion.numeroOperacion})`
    : liquidacion.medio === "EFECTIVO"
      ? "Efectivo"
      : MEDIOS[liquidacion.medio];

  try {
    const hecho = await prisma.$transaction(async (tx) => {
      await bloquearCasa(tx, datos.predioId);
      // Si otro envío del mismo pago ganó el candado, ya no queda deuda: se devuelve lo que ese dejó (AC-5).
      const ya = await tx.pago.findUnique({ where: { idOperacion: datos.idOperacion } });
      if (ya) return { repetido: ya };
      const cuotas = await cuotasImpagasDe(tx, datos.predioId);
      if (!cuotas.length) throw new ErrorReglaNegocio("Esa casa ya está al día: no debe nada.");
      if (
        await semanasYaEnPago(
          tx,
          cuotas.map((c) => c.id),
        )
      ) {
        throw new ErrorReglaNegocio(
          "Esa casa tiene un pago en revisión. Resuélvalo antes de registrar este pago.",
        );
      }
      const monto = cuotas.reduce((suma, c) => suma + c.saldoPendiente, 0);
      const { partes } = repartirCobro(
        monto,
        cuotas.map((c) => ({ id: c.id, saldo: c.saldoPendiente })),
      );
      const pago = await crearPagoPresencial(tx, {
        idOperacion: datos.idOperacion,
        predioId: datos.predioId,
        autorId: sesion.usuarioId,
        monto,
        creadoEn: ahora,
        partes,
        medio: liquidacion.medio,
      });
      const semanas = textoDeSemanas(cuotas.map((c) => c.periodo));
      const { recibo } = await aplicarPagoAprobado(tx, {
        pago,
        partes,
        titular: casa.nombre,
        vivienda: casa.vivienda,
        concepto: `Cuota de vigilancia: ${semanas} (deuda acumulada)`,
        registradoPor: { id: sesion.usuarioId, nombre: sesion.nombreCompleto },
        fecha: ahora,
        ahora,
        avisarA: casa.residentes,
        accion: "liquidar_deuda",
        enviarRecibo: true,
        medioTexto,
        avisoExtra: casa.estadoGarita === "ROJO" ? "La reja vuelve a abrirse sola." : undefined,
      });
      if (vigilantes.length) {
        await encolarAvisos(
          vigilantes.map((destinatarioId) => ({
            destinatarioId,
            tipo: "GARITA" as const,
            titulo: "Una casa se puso al día",
            texto: `${casa.vivienda} pagó toda su deuda: la reja vuelve a abrirse sola.`,
          })),
          tx,
        );
      }
      return { monto, semanas, recibo, repetido: null };
    });
    if (hecho.repetido) {
      const ya = hecho.repetido;
      return repetida(sesion, ya.id, ya.autorId, ya.predioId, ya.monto);
    }
    const nombresAvisados = await nombresDe(vigilantes);
    return {
      aplicado: true,
      predioId: datos.predioId,
      nombre: casa.nombre,
      vivienda: casa.vivienda,
      monto: hecho.monto,
      semanas: hecho.semanas,
      reabreLaReja: casa.estadoGarita === "ROJO",
      garita: vigilantes.map((id) => nombresAvisados.get(id) ?? ""),
      cuando: fechaYHora(ahora),
      recibo: aReciboDto(hecho.recibo),
    };
  } catch (error) {
    // Otro envío del mismo pago llegó a la vez: ya está registrado, no se repite (UNIQUE idOperacion).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const ya = await pagoPorIdOperacion(datos.idOperacion);
      if (ya) return repetida(sesion, ya.id, ya.autorId, ya.predioId, ya.monto);
    }
    throw error;
  }
}

/** El pago que ya estaba registrado con ese identificador: se devuelve igual, sin abonar de nuevo (AC-5). */
async function repetida(sesion: SesionDto, pagoId: string, autorId: string, predioId: string, monto: number) {
  // Otra persona no puede ver ni reusar un pago ajeno con ese identificador (AC-7).
  if (autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
  const [casas, recibo] = await Promise.all([casasDe([predioId]), reciboDelPago(pagoId)]);
  const casa = casas.get(predioId);
  return {
    aplicado: false,
    predioId,
    nombre: casa?.nombre ?? "",
    vivienda: casa?.vivienda ?? "",
    monto,
    semanas: recibo
      ? recibo.concepto.replace(/^Cuota de vigilancia: /, "").replace(/ \(deuda acumulada\)$/, "")
      : "",
    reabreLaReja: false,
    garita: [] as string[],
    cuando: recibo ? fechaYHora(recibo.fecha) : "",
    recibo: recibo ? aReciboDto(recibo) : null,
  };
}

export type DeudaLiquidada = Awaited<ReturnType<typeof liquidarDeuda>>;
