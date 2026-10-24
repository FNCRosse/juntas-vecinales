// @HU-COB-11
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { aplicarPagoAprobado } from "@/modulos/aportes/aplicacion/abono";
import { cuotasPagables } from "@/modulos/aportes/aplicacion/pagos";
import { aReciboDto } from "@/modulos/aportes/aplicacion/recibos";
import {
  fechaDelCobro,
  numeroDePedidoDeCobro,
  prepararPedidoDeCobro,
  repartirCobro,
  validarMontoCobrado,
} from "@/modulos/aportes/dominio/cobro";
import { lunesDe } from "@/modulos/aportes/dominio/cuota";
import { opcionesDePago, rangoDeSemanas } from "@/modulos/aportes/dominio/pago";
import { FRANJAS } from "@/modulos/aportes/dominio/recibo";
import {
  crearPedidoDeCobro,
  hayPedidoPendiente,
  pedidoDeCobroPorId,
  pedidoDeCobroPorIdOperacion,
  pedidosDeCobroPendientes,
  reclamarCancelacion,
  reclamarCobro,
} from "@/modulos/aportes/infraestructura/repositorioCobros";
import {
  bloquearCasa,
  crearPagoPresencial,
  cuotasImpagasDe,
  pagoPorIdOperacion,
} from "@/modulos/aportes/infraestructura/repositorioPagos";
import { crearPedido, reciboDelPago } from "@/modulos/aportes/infraestructura/repositorioRecibos";
import { directivaParaAvisar, nombresDe, telefonoDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

type Pedido = NonNullable<Awaited<ReturnType<typeof pedidoDeCobroPorId>>>;

/** Las semanas que pidió pagar, en palabras: «3 semanas, del 7 al 27 de setiembre» (las más antiguas que todavía debe). */
async function semanasPedidas(predioId: string, semanas: number) {
  const opcion = opcionesDePago(await cuotasPagables(predioId)).find((o) => o.semanas === semanas);
  return opcion?.detalle ?? `${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
}

async function aPedidoDto(pedido: Pedido, vivienda: string) {
  return {
    id: pedido.id,
    numero: numeroDePedidoDeCobro(pedido.numero),
    enviado: fechaYHora(pedido.creadoEn),
    monto: pedido.monto,
    semanas: await semanasPedidas(pedido.predioId, pedido.semanas),
    donde: `En su casa, ${vivienda}`,
    franja: FRANJAS[pedido.franja].resumen,
    estado:
      pedido.estado === "PENDIENTE"
        ? "Pendiente de visita"
        : pedido.estado === "COBRADO"
          ? "Cobrado"
          : "Cancelado",
  };
}

/**
 * La casa pide que la directiva vaya a cobrarle en efectivo (HU-COB-11, VEC-COB-02 y 13). No cobra nada ni reserva
 * semanas: guarda cuánto pensaba pagar y a qué hora le queda mejor, y avisa a la directiva. Una casa tiene a lo más un
 * pedido pendiente. Repetir el mismo `idOperacion` devuelve el pedido ya hecho sin avisar otra vez (AC-5); el aviso y
 * la auditoría van en la misma transacción (AC-6).
 */
export async function pedirCobroEnCasa(
  sesion: SesionDto,
  datos: { semanas: number; franja: string; nota?: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previo = await pedidoDeCobroPorIdOperacion(datos.idOperacion);
  if (previo) {
    // Otra casa no puede ver ni reusar un pedido ajeno con ese identificador (AC-7).
    const casa = await predioDelVecino(sesion.usuarioId);
    if (previo.solicitanteId !== sesion.usuarioId || !casa) throw new ErrorNoEncontrado();
    return { pedido: await aPedidoDto(previo, casa.vivienda), creado: false };
  }
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const { errores, pedido } = prepararPedidoDeCobro({
    semanas: datos.semanas,
    franja: datos.franja,
    nota: datos.nota ?? "",
  });
  const opcion =
    pedido && opcionesDePago(await cuotasPagables(casa.id)).find((o) => o.semanas === pedido.semanas);
  if (pedido && !opcion) errores.semanas = "Elija cuánto va a pagar.";
  if (!pedido || !opcion || Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const destinatarios = await directivaParaAvisar();
  const creado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await hayPedidoPendiente(tx, casa.id)) {
      throw new ErrorReglaNegocio(
        "Ya pidió que vayan a cobrar a su casa. La directiva la llamará para acordar la visita.",
      );
    }
    const fila = await crearPedidoDeCobro(tx, {
      idOperacion: datos.idOperacion,
      predioId: casa.id,
      solicitanteId: sesion.usuarioId,
      semanas: pedido.semanas,
      monto: opcion.monto,
      franja: pedido.franja,
      nota: pedido.nota,
      creadoEn: ahora,
    });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Pidieron que vayan a cobrar",
        texto: `${sesion.nombreCompleto} (${casa.vivienda}) pidió que vayan a cobrar ${soles(opcion.monto)} a su casa. Véalo en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "pedir_cobro_en_casa",
        entidad: "PedidoCobroEnCasa",
        entidadId: fila.id,
        antes: null,
        despues: { pedido: numeroDePedidoDeCobro(fila.numero), monto: soles(opcion.monto) },
      },
      tx,
    );
    return fila;
  });
  return { pedido: await aPedidoDto(creado, casa.vivienda), creado: true };
}

/** «Prefiero pagar por Yape o transferencia» (VEC-COB-13): la casa cancela su pedido. Cancelarlo dos veces cambia una sola vez. */
export async function cancelarPedidoDeCobro(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const pedido = await pedidoDeCobroPorId(id);
  if (!casa || !pedido || pedido.predioId !== casa.id) throw new ErrorNoEncontrado();
  const aplicado = await prisma.$transaction(async (tx) => {
    if (!(await reclamarCancelacion(tx, pedido.id))) return false;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "cancelar_cobro_en_casa",
        entidad: "PedidoCobroEnCasa",
        entidadId: pedido.id,
        antes: null,
        despues: { pedido: numeroDePedidoDeCobro(pedido.numero) },
      },
      tx,
    );
    return true;
  });
  return { aplicado };
}

/** Cobros: los pedidos de cobro en casa por atender (DIR-COB-07), el más reciente primero. */
export async function cobrosEnCasaPorAtender(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const pedidos = await pedidosDeCobroPendientes();
  const [casas, nombres, miCasa] = await Promise.all([
    casasDe([...new Set(pedidos.map((p) => p.predioId))]),
    nombresDe([...new Set(pedidos.map((p) => p.solicitanteId))]),
    predioDelVecino(sesion.usuarioId),
  ]);
  return {
    items: pedidos.map((p) => {
      const esSuyo = p.predioId === miCasa?.id;
      return {
        id: p.id,
        numero: numeroDePedidoDeCobro(p.numero),
        nombre: nombres.get(p.solicitanteId) ?? "",
        vivienda: casas.get(p.predioId)?.vivienda ?? "",
        franja: FRANJAS[p.franja].resumen,
        fecha: fechaCorta(p.creadoEn),
        monto: p.monto,
        esSuyo,
        puedeCobrar: sesion.roles.includes("DIRECTIVA") && !esSuyo,
      };
    }),
  };
}

export type CobrosEnCasaPorAtender = Awaited<ReturnType<typeof cobrosEnCasaPorAtender>>;

/**
 * Cobrar en casa (DIR-COB-08): los datos del pedido para llamar a la vecina y registrar lo que recibe, con lo que debe
 * hoy la casa. Cobrar es solo de la directiva y nunca en su propia casa (lo registra otro miembro).
 */
export async function verPedidoDeCobro(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const pedido = await pedidoDeCobroPorId(id);
  if (!pedido) throw new ErrorNoEncontrado();
  const [casas, nombres, telefono, miCasa, impagas] = await Promise.all([
    casasDe([pedido.predioId]),
    nombresDe([pedido.solicitanteId]),
    telefonoDe(pedido.solicitanteId),
    predioDelVecino(sesion.usuarioId),
    prisma.cuota.findMany({
      where: { predioId: pedido.predioId, estado: { not: "PAGADA" }, saldoPendiente: { gt: 0 } },
      orderBy: { periodo: "asc" },
    }),
  ]);
  const esSuyo = pedido.predioId === miCasa?.id;
  return {
    id: pedido.id,
    numero: numeroDePedidoDeCobro(pedido.numero),
    nombre: nombres.get(pedido.solicitanteId) ?? "",
    vivienda: casas.get(pedido.predioId)?.vivienda ?? "",
    telefono,
    franja: FRANJAS[pedido.franja].resumen,
    nota: pedido.nota,
    monto: pedido.monto,
    semanas: await semanasPedidas(pedido.predioId, pedido.semanas),
    debe: impagas.reduce((suma, c) => suma + c.saldoPendiente, 0),
    esSuyo,
    pendiente: pedido.estado === "PENDIENTE",
    puedeCobrar: sesion.roles.includes("DIRECTIVA") && !esSuyo && pedido.estado === "PENDIENTE",
  };
}

export type PedidoParaCobrar = Awaited<ReturnType<typeof verPedidoDeCobro>>;

/** Lo que dice el recibo de un cobro en efectivo: las semanas que cubrió y, si quedó una a medias, que fue un abono. */
function conceptoDelCobro(periodos: Date[], parcial: boolean) {
  if (!periodos.length) return "Cuota de vigilancia: sin semanas pendientes";
  const lunes = periodos.map(lunesDe);
  const cuantas = `${lunes.length} ${lunes.length === 1 ? "semana" : "semanas"}`;
  return `Cuota de vigilancia: ${cuantas}, ${rangoDeSemanas(lunes[0], lunes.at(-1)!)}${parcial ? " (abono parcial)" : ""}`;
}

type PagoConDetalle = NonNullable<Awaited<ReturnType<typeof pagoPorIdOperacion>>>;

async function resultadoDelCobro(
  pago: PagoConDetalle,
  aplicado: boolean,
  extra: { excedente: number; debe: number },
) {
  const [recibo, casas, nombres] = await Promise.all([
    reciboDelPago(pago.id),
    casasDe([pago.predioId]),
    nombresDe([pago.autorId]),
  ]);
  return {
    aplicado,
    pagoId: pago.id,
    vivienda: casas.get(pago.predioId)?.vivienda ?? "",
    monto: pago.monto,
    excedente: extra.excedente,
    debeAhora: extra.debe,
    alDia: extra.debe === 0,
    recibo: recibo ? aReciboDto(recibo) : null,
    registradoPor: nombres.get(pago.autorId) ?? "",
  };
}

/**
 * Registra el efectivo que cobró la directiva en la casa (HU-COB-11, DIR-COB-08 y 09): nace aprobado, reparte lo
 * recibido entre las cuotas más antiguas, restituye la garita si ya no hay atraso crítico, emite el recibo oficial y
 * lo envía a la app de la casa (y, si se pidió, deja el recibo en papel por entregar). El teléfono lo manda cuando
 * tiene señal, a veces horas después: la hora que vale es la del cobro. Repetir el mismo `idOperacionLocal` devuelve lo
 * ya registrado sin abonar ni avisar otra vez (AC-5). Lo que sobra si la casa ya no debía tanto no se pierde: queda
 * dicho como excedente. Solo la directiva y nunca en su propia casa; todo en una transacción con su auditoría (AC-6).
 */
export async function registrarCobroEnEfectivo(
  sesion: SesionDto,
  datos: {
    idOperacionLocal: string;
    pedidoId: string;
    monto: number;
    reciboEnPapel: boolean;
    registradoEn?: string;
  },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  const previo = await pagoPorIdOperacion(datos.idOperacionLocal);
  if (previo) return repetido(sesion, previo);
  const errorDeMonto = validarMontoCobrado(datos.monto);
  if (errorDeMonto) throw new ErrorValidacion(undefined, { monto: errorDeMonto });
  const pedido = await pedidoDeCobroPorId(datos.pedidoId);
  if (!pedido) throw new ErrorNoEncontrado();
  const miCasa = await predioDelVecino(sesion.usuarioId);
  if (pedido.predioId === miCasa?.id) {
    throw new ErrorReglaNegocio("Es el cobro de su casa: lo registra otro miembro de la directiva.");
  }
  if (pedido.estado !== "PENDIENTE")
    throw new ErrorReglaNegocio("Ese pedido de cobro ya se registró o se canceló.");
  const fecha = fechaDelCobro(datos.registradoEn, ahora);
  const [casas, nombres] = await Promise.all([casasDe([pedido.predioId]), nombresDe([pedido.solicitanteId])]);

  try {
    const hecho = await prisma.$transaction(async (tx) => {
      await bloquearCasa(tx, pedido.predioId);
      const cuotas = await cuotasImpagasDe(tx, pedido.predioId);
      const { partes, excedente } = repartirCobro(
        datos.monto,
        cuotas.map((c) => ({ id: c.id, saldo: c.saldoPendiente })),
      );
      const pago = await crearPagoPresencial(tx, {
        idOperacion: datos.idOperacionLocal,
        predioId: pedido.predioId,
        autorId: sesion.usuarioId,
        monto: datos.monto,
        creadoEn: fecha,
        partes,
      });
      if (!(await reclamarCobro(tx, pedido.id, pago.id, fecha))) {
        throw new ErrorReglaNegocio("Ese pedido de cobro ya se registró o se canceló.");
      }
      const saldos = new Map(cuotas.map((c) => [c.id, c.saldoPendiente]));
      const cubiertas = cuotas.filter((c) => partes.some((p) => p.cuotaId === c.id));
      const parcial = partes.some((p) => p.monto < (saldos.get(p.cuotaId) ?? 0));
      const { debe, recibo } = await aplicarPagoAprobado(tx, {
        pago,
        partes,
        titular: nombres.get(pedido.solicitanteId) ?? "",
        vivienda: casas.get(pedido.predioId)?.vivienda ?? "",
        concepto: conceptoDelCobro(
          cubiertas.map((c) => c.periodo),
          parcial,
        ),
        registradoPor: { id: sesion.usuarioId, nombre: sesion.nombreCompleto },
        fecha,
        ahora,
        avisarA: [pedido.solicitanteId],
        accion: "registrar_cobro_en_efectivo",
        enviarRecibo: true,
        excedente,
      });
      if (datos.reciboEnPapel) {
        await crearPedido(tx, {
          idOperacion: `${datos.idOperacionLocal}:papel`,
          reciboId: recibo.id,
          solicitanteId: pedido.solicitanteId,
          franja: pedido.franja,
          nota: "Cobro en casa: se pidió el recibo impreso.",
          creadoEn: ahora,
        });
      }
      return { pago, excedente, debe };
    });
    return {
      ...(await resultadoDelCobro(hecho.pago, true, { excedente: hecho.excedente, debe: hecho.debe })),
      reciboEnPapel: datos.reciboEnPapel,
      nombre: nombres.get(pedido.solicitanteId) ?? "",
    };
  } catch (error) {
    // Otro envío del mismo cobro llegó a la vez: ya está registrado, no se repite (UNIQUE idOperacion).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const ya = await pagoPorIdOperacion(datos.idOperacionLocal);
      if (ya) return repetido(sesion, ya);
    }
    throw error;
  }
}

/** El cobro que ya estaba registrado con ese identificador: se devuelve igual, sin volver a abonar (AC-5). */
async function repetido(sesion: SesionDto, pago: PagoConDetalle) {
  // Otro usuario no puede ver ni reusar un cobro ajeno con ese identificador (AC-7).
  if (pago.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
  const impagas = await prisma.cuota.findMany({
    where: { predioId: pago.predioId, estado: { not: "PAGADA" }, saldoPendiente: { gt: 0 } },
  });
  const debe = impagas.reduce((suma, c) => suma + c.saldoPendiente, 0);
  const aplicado = pago.cuotas.reduce((suma, c) => suma + c.monto, 0);
  const [pedidoDePapel, pedido] = await Promise.all([
    prisma.pedidoReciboPapel.count({ where: { idOperacion: `${pago.idOperacion}:papel` } }),
    prisma.pedidoCobroEnCasa.findUnique({ where: { pagoId: pago.id } }),
  ]);
  const nombres = await nombresDe(pedido ? [pedido.solicitanteId] : []);
  return {
    ...(await resultadoDelCobro(pago, false, { excedente: pago.monto - aplicado, debe })),
    reciboEnPapel: pedidoDePapel > 0,
    nombre: (pedido && nombres.get(pedido.solicitanteId)) ?? "",
  };
}

export type CobroRegistrado = Awaited<ReturnType<typeof registrarCobroEnEfectivo>>;
