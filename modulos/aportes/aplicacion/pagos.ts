// @HU-COB-08
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { lunesDe } from "@/modulos/aportes/dominio/cuota";
import {
  MEDIOS,
  MEDIOS_DIGITALES,
  type MedioDigital,
  numeroDeConstancia,
  opcionesDePago,
  rangoDeSemanas,
} from "@/modulos/aportes/dominio/pago";
import { cuotasPorPagarDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import {
  bloquearCasa,
  crearPago,
  cuotasEnRevision,
  deudaPorCasa,
  pagoDeLaCasa,
  pagoPorIdOperacion,
  type PagoConDetalle,
  pagosDeLaCasa,
  pagosPorRevisar,
  periodosDelPago,
  semanasYaEnPago,
} from "@/modulos/aportes/infraestructura/repositorioPagos";
import { directivaParaAvisar, nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

export const USO_COMPROBANTE_PAGO = "comprobante_pago";
const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const MENSAJE_FOTO =
  "Falta la foto de su comprobante, o pesa más de 5 MB. Suba una captura de pantalla; si no puede, pida ayuda a una persona.";

const ESTADO_EN_TEXTO = {
  REGISTRADO: "En revisión",
  APROBADO: "Aprobado",
  OBSERVADO: "Observado",
  RECHAZADO: "Rechazado",
} as const;

const diaYMes = (fecha: Date) => fechaCorta(fecha).replace(/ de \d{4}$/, "");

/** Las semanas que cubre un pago, en palabras: «2 semanas, del 7 al 20 de setiembre». */
async function semanasDelPago(pago: PagoConDetalle) {
  const lunes = (await periodosDelPago(pago.cuotas.map((c) => c.cuotaId))).map(lunesDe);
  if (!lunes.length) return "";
  const cuantas = `${lunes.length} ${lunes.length === 1 ? "semana" : "semanas"}`;
  return `${cuantas}, ${rangoDeSemanas(lunes[0], lunes.at(-1)!)}`;
}

async function aDto(pago: PagoConDetalle) {
  return {
    id: pago.id,
    constancia: numeroDeConstancia(pago.numero),
    monto: pago.monto,
    semanas: await semanasDelPago(pago),
    medio: MEDIOS[pago.medio],
    estado: ESTADO_EN_TEXTO[pago.estado],
    enviado: fechaYHora(pago.creadoEn),
  };
}

/** Las cuotas de la casa que todavía se pueden pagar: sin pagar del todo y fuera de un pago en revisión. */
async function cuotasPagables(predioId: string) {
  const cuotas = await cuotasPorPagarDe(predioId);
  const enRevision = await cuotasEnRevision(cuotas.map((c) => c.id));
  return cuotas
    .filter((c) => !enRevision.has(c.id))
    .map((c) => ({ id: c.id, periodo: lunesDe(c.periodo), saldo: c.saldoPendiente }));
}

/**
 * Lo que necesita «Pagar mi cuota» (VEC-COB-02): cuánto puede pagar la casa, cómo y a dónde. Los datos de pago de la
 * junta (número de Yape o Plin y cuenta) salen de la configuración, no del código: los pone la autora.
 */
export async function datosParaPagar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const opciones = opcionesDePago(await cuotasPagables(casa.id)).map(
    ({ semanas, monto, titulo, detalle }) => ({
      semanas,
      monto,
      titulo,
      detalle,
    }),
  );
  return {
    vivienda: casa.vivienda,
    opciones,
    medios: MEDIOS_DIGITALES.map((valor) => ({ valor, etiqueta: MEDIOS[valor] })),
    datosDePago: {
      yape: process.env.DATOS_PAGO_YAPE ?? null,
      cuenta: process.env.DATOS_PAGO_CUENTA ?? null,
    },
  };
}

export type DatosParaPagar = Awaited<ReturnType<typeof datosParaPagar>>;

/**
 * Registra el pago que manda una casa con la foto de su comprobante (HU-COB-08): queda en revisión, con su constancia de
 * envío, y se avisa de inmediato a la directiva (CA2 y CA3). No cambia ninguna cuota: lo hace la directiva al
 * aprobarlo. Las semanas que ya están en otro pago en revisión no se pueden volver a pagar. Repetir el mismo
 * `idOperacion` devuelve el pago ya registrado sin avisar otra vez (AC-5). Todo en una transacción con su auditoría (AC-6).
 */
export async function registrarPagoDigital(
  sesion: SesionDto,
  datos: { semanas: number; medio: string; archivoId: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previa = await pagoPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar un pago ajeno con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { pago: await aDto(previa), creado: false };
  }
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();

  const opciones = opcionesDePago(await cuotasPagables(casa.id));
  const opcion = opciones.find((o) => o.semanas === datos.semanas);
  const medio = MEDIOS_DIGITALES.find((m): m is MedioDigital => m === datos.medio);
  const propios = datos.archivoId
    ? await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE_PAGO, [datos.archivoId])
    : new Set<string>();
  const errores: Record<string, string> = {};
  if (!opcion) errores.semanas = "Elija cuánto va a pagar.";
  if (!medio) errores.medio = "Elija cómo va a pagar.";
  if (!propios.has(datos.archivoId)) errores.archivoId = MENSAJE_FOTO;
  if (Object.keys(errores).length || !opcion || !medio) throw new ErrorValidacion(undefined, errores);

  const destinatarios = await directivaParaAvisar();
  const cuotas = await prisma.cuota.findMany({ where: { id: { in: opcion.cuotaIds } } });
  const creado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await semanasYaEnPago(tx, opcion.cuotaIds)) {
      throw new ErrorReglaNegocio("Esas semanas ya están en un pago que la directiva está revisando.");
    }
    const fila = await crearPago(tx, {
      idOperacion: datos.idOperacion,
      predioId: casa.id,
      autorId: sesion.usuarioId,
      medio,
      monto: opcion.monto,
      creadoEn: ahora,
      archivoId: datos.archivoId,
      cuotas: cuotas.map((c) => ({ cuotaId: c.id, monto: c.saldoPendiente })),
    });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Llegó un comprobante de pago",
        texto: `${casa.vivienda} mandó su pago de ${soles(opcion.monto)} por ${MEDIOS[medio]}. Revíselo en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "registrar_pago_digital",
        entidad: "Pago",
        entidadId: fila.id,
        antes: null,
        despues: {
          constancia: numeroDeConstancia(fila.numero),
          monto: soles(opcion.monto),
          medio: MEDIOS[medio],
          semanas: opcion.semanas,
        },
      },
      tx,
    );
    return fila;
  });
  return { pago: await aDto(creado), creado: true };
}

/** Mis pagos (VEC-COB-05): los pagos de la casa con su fecha, su medio y su estado, el más reciente primero. */
export async function misPagos(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) return { pagos: [] };
  return {
    pagos: (await pagosDeLaCasa(casa.id)).map((p) => ({
      id: p.id,
      titulo: `Pago del ${diaYMes(p.creadoEn)}`,
      monto: p.monto,
      detalle: `${fechaCorta(p.creadoEn)} · ${MEDIOS[p.medio]}`,
      estado: ESTADO_EN_TEXTO[p.estado],
      constancia: numeroDeConstancia(p.numero),
    })),
  };
}

/** La constancia de envío en PDF: solo de un pago de la casa de quien la pide (AC-7). */
export async function constanciaDePago(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const pago = casa ? await pagoDeLaCasa(casa.id, id) : null;
  if (!casa || !pago) throw new ErrorNoEncontrado();
  const dto = await aDto(pago);
  const pdf = await generarPdf({
    titulo: "Constancia de envío de pago",
    subtitulos: [`N.° ${dto.constancia}`, "Junta Vecinal de Villa de Fátima"],
    secciones: [
      {
        titulo: "Su pago",
        filas: [
          ["Casa", casa.vivienda],
          ["Monto", soles(dto.monto)],
          ["Qué paga", dto.semanas],
          ["Cómo pagó", dto.medio],
          ["Enviado el", dto.enviado],
          ["Estado", "Pendiente de revisión: la directiva revisará su comprobante."],
        ],
      },
    ],
    pie: "Esta constancia no es el recibo oficial. Cuando la directiva valide su pago, le llegará su recibo.",
  });
  return { pdf, nombreArchivo: `constancia-${dto.constancia}.pdf` };
}

/**
 * Cobros: comprobantes por revisar (DIR-COB-01): los pagos digitales que esperan a la directiva, el más reciente
 * primero, con lo que debía la casa. Un pago de la casa de quien revisa se marca para que lo revise otro miembro.
 */
export async function comprobantesPorRevisar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const pagos = await pagosPorRevisar();
  const predios = [...new Set(pagos.map((p) => p.predioId))];
  const [casas, deudas, nombres, miCasa] = await Promise.all([
    casasDe(predios),
    deudaPorCasa(predios),
    nombresDe([...new Set(pagos.map((p) => p.autorId))]),
    predioDelVecino(sesion.usuarioId),
  ]);
  return {
    items: pagos.map((p) => {
      const debia = deudas.get(p.predioId) ?? 0;
      return {
        id: p.id,
        medio: MEDIOS[p.medio],
        nombre: nombres.get(p.autorId) ?? "",
        vivienda: casas.get(p.predioId)?.vivienda ?? "",
        debia,
        fecha: fechaYHora(p.creadoEn),
        monto: p.monto,
        etiqueta: p.monto < debia ? "Pago parcial" : "Por revisar",
        esSuyo: p.autorId === sesion.usuarioId || p.predioId === miCasa?.id,
      };
    }),
  };
}

export type ComprobantesPorRevisar = Awaited<ReturnType<typeof comprobantesPorRevisar>>;
