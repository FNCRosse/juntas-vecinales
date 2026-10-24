// @HU-COB-08
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { MedioDePago } from "@/compartido/bd/generado/client";

const conDetalle = {
  cuotas: true,
  comprobantes: { orderBy: { creadoEn: "asc" } },
  recibo: true,
} as const;

export type PagoConDetalle = NonNullable<Awaited<ReturnType<typeof pagoPorIdOperacion>>>;

export const pagoPorIdOperacion = (idOperacion: string) =>
  prisma.pago.findUnique({ where: { idOperacion }, include: conDetalle });

/** Un pago de esa casa: otra casa no lo encuentra (AC-7). */
export const pagoDeLaCasa = (predioId: string, id: string) =>
  prisma.pago.findFirst({ where: { id, predioId }, include: conDetalle });

export const pagosDeLaCasa = (predioId: string) =>
  prisma.pago.findMany({
    where: { predioId },
    include: conDetalle,
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

/** Los pagos que esperan revisión de la directiva, el más reciente primero. */
export const pagosPorRevisar = () =>
  prisma.pago.findMany({
    where: { estado: "REGISTRADO" },
    include: conDetalle,
    orderBy: { creadoEn: "desc" },
    take: 200,
  });

/**
 * Las cuotas de esa casa que ya están dentro de un pago en revisión, con el pago al que pertenecen: no se pueden
 * pagar otra vez mientras la directiva lo revisa.
 */
export async function cuotasEnRevision(cuotaIds: string[]) {
  if (!cuotaIds.length) return new Map<string, { pagoId: string; numero: number; monto: number }>();
  const filas = await prisma.pagoCuota.findMany({
    where: { cuotaId: { in: cuotaIds }, pago: { estado: "REGISTRADO" } },
    include: { pago: { select: { id: true, numero: true, monto: true } } },
  });
  return new Map(
    filas.map((f) => [f.cuotaId, { pagoId: f.pago.id, numero: f.pago.numero, monto: f.pago.monto }]),
  );
}

/** Las semanas (lunes) de las cuotas que cubre un pago, de la más antigua a la más nueva. */
export async function periodosDelPago(cuotaIds: string[]) {
  const cuotas = await prisma.cuota.findMany({
    where: { id: { in: cuotaIds } },
    select: { periodo: true },
    orderBy: { periodo: "asc" },
  });
  return cuotas.map((c) => c.periodo);
}

/** Cuánto debe cada casa hoy: la suma del saldo de sus cuotas sin pagar. */
export async function deudaPorCasa(predioIds: string[]) {
  const filas = await prisma.cuota.groupBy({
    by: ["predioId"],
    where: { predioId: { in: predioIds }, estado: { not: "PAGADA" } },
    _sum: { saldoPendiente: true },
  });
  return new Map(filas.map((f) => [f.predioId, f._sum.saldoPendiente ?? 0]));
}

/** Serializa los pagos de una misma casa: dos envíos a la vez no pueden cubrir las mismas semanas. */
export async function bloquearCasa(tx: Transaccion, predioId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`pago:${predioId}`}))`;
}

export async function semanasYaEnPago(tx: Transaccion, cuotaIds: string[]) {
  return tx.pagoCuota.count({ where: { cuotaId: { in: cuotaIds }, pago: { estado: "REGISTRADO" } } });
}

export const crearPago = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    predioId: string;
    autorId: string;
    medio: MedioDePago;
    monto: number;
    creadoEn: Date;
    archivoId: string;
    cuotas: { cuotaId: string; monto: number }[];
  },
) =>
  tx.pago.create({
    data: {
      idOperacion: datos.idOperacion,
      predioId: datos.predioId,
      autorId: datos.autorId,
      medio: datos.medio,
      monto: datos.monto,
      creadoEn: datos.creadoEn,
      cuotas: { create: datos.cuotas },
      comprobantes: { create: { archivoId: datos.archivoId, creadoEn: datos.creadoEn } },
    },
    include: conDetalle,
  });

/** Un comprobante con su pago y lo que ese pago cubre, para revisarlo (HU-COB-09). */
export const comprobantePorId = (id: string) =>
  prisma.comprobante.findUnique({ where: { id }, include: { pago: { include: conDetalle } } });

export const archivoPorId = (id: string) =>
  prisma.archivo.findUnique({ where: { id }, select: { id: true, tipo: true } });

/** Las cuotas que todavía se deben (con saldo), para medir el retraso de la casa después de un abono. */
export const cuotasImpagasDe = (tx: Transaccion, predioId: string) =>
  tx.cuota.findMany({
    where: { predioId, estado: { not: "PAGADA" }, saldoPendiente: { gt: 0 } },
    orderBy: { periodo: "asc" },
  });

/**
 * Pasa el pago de «en revisión» a aprobado con un UPDATE condicionado: si otra aprobación llegó primero, no cambia
 * nada y devuelve falso, así el abono se aplica una sola vez (AC-5).
 */
export async function reclamarAprobacion(tx: Transaccion, pagoId: string) {
  const { count } = await tx.pago.updateMany({
    where: { id: pagoId, estado: "REGISTRADO" },
    data: { estado: "APROBADO" },
  });
  return count === 1;
}

/** Las cuotas que están en un pago observado: la casa todavía puede subsanarlo, pero no reservan la semana (HU-COB-10). */
export async function cuotasEnPagoObservado(cuotaIds: string[]) {
  if (!cuotaIds.length) return new Set<string>();
  const filas = await prisma.pagoCuota.findMany({
    where: { cuotaId: { in: cuotaIds }, pago: { estado: "OBSERVADO" } },
    select: { cuotaId: true },
  });
  return new Set(filas.map((f) => f.cuotaId));
}

/** Pasa el pago de «en revisión» a observado con un UPDATE condicionado: observar dos veces no avisa dos veces (AC-5). */
export async function reclamarObservacion(tx: Transaccion, pagoId: string) {
  const { count } = await tx.pago.updateMany({
    where: { id: pagoId, estado: "REGISTRADO" },
    data: { estado: "OBSERVADO" },
  });
  return count === 1;
}

/** Devuelve el pago observado a revisión cuando la casa manda otra foto; solo una llamada lo logra (AC-5). */
export async function reclamarReenvio(tx: Transaccion, pagoId: string) {
  const { count } = await tx.pago.updateMany({
    where: { id: pagoId, estado: "OBSERVADO" },
    data: { estado: "REGISTRADO" },
  });
  return count === 1;
}

/** Las semanas de este pago que ya están dentro de otro pago en revisión. */
export const semanasEnOtroPago = (tx: Transaccion, pagoId: string, cuotaIds: string[]) =>
  tx.pagoCuota.count({
    where: { cuotaId: { in: cuotaIds }, pago: { estado: "REGISTRADO", id: { not: pagoId } } },
  });

/** El pago en efectivo que cobra la directiva en la casa (HU-COB-11): nace aprobado y con lo que cubre fijado. */
export const crearPagoPresencial = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    predioId: string;
    autorId: string;
    monto: number;
    creadoEn: Date;
    partes: { cuotaId: string; monto: number }[];
    /** Efectivo salvo cuando la casa liquida su deuda por Yape, Plin o transferencia (HU-COB-07). */
    medio?: MedioDePago;
  },
) =>
  tx.pago.create({
    data: {
      idOperacion: datos.idOperacion,
      predioId: datos.predioId,
      autorId: datos.autorId,
      medio: datos.medio ?? "EFECTIVO",
      monto: datos.monto,
      estado: "APROBADO",
      creadoEn: datos.creadoEn,
      cuotas: { create: datos.partes },
    },
    include: conDetalle,
  });
