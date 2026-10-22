// @HU-COB-08
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { MedioDePago } from "@/compartido/bd/generado/client";

const conDetalle = { cuotas: true, comprobantes: { orderBy: { creadoEn: "asc" } } } as const;

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
