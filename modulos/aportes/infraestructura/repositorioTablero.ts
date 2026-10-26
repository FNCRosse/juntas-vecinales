// @HU-COB-13
import { prisma } from "@/compartido/bd/cliente";

/** Qué casas se miran: todas (`null`), solo estas (`en`) o todas menos estas (`fuera`, para «al día»). */
export type CasasMiradas = { en: string[] } | { fuera: string[] } | null;

const deLasCasas = (casas: CasasMiradas) =>
  casas === null ? {} : "en" in casas ? { predioId: { in: casas.en } } : { predioId: { notIn: casas.fuera } };

/** Los recibos emitidos entre esos dos instantes (`hasta` no entra), con el medio con que se pagó. */
export const recibosDelPeriodo = (desde: Date, hasta: Date, casas: CasasMiradas) =>
  prisma.recibo.findMany({
    where: { fecha: { gte: desde, lt: hasta }, ...deLasCasas(casas) },
    select: { predioId: true, monto: true, fecha: true, pago: { select: { medio: true } } },
  });

/** Lo que suman los pagos aprobados cuyo recibo cae en el periodo: la segunda cuenta con la que se comprueba el total. */
export async function pagosAprobadosDelPeriodo(desde: Date, hasta: Date, casas: CasasMiradas) {
  const { _sum } = await prisma.pago.aggregate({
    _sum: { monto: true },
    where: {
      estado: "APROBADO",
      recibo: { is: { fecha: { gte: desde, lt: hasta } } },
      ...deLasCasas(casas),
    },
  });
  return _sum.monto ?? 0;
}

/** Pagos aprobados a los que nunca se les emitió recibo: no deberían existir, y si hay uno el tablero no cuadra. */
export const pagosAprobadosSinRecibo = (casas: CasasMiradas) =>
  prisma.pago.count({ where: { estado: "APROBADO", recibo: null, ...deLasCasas(casas) } });

/** Lo que todavía se debe de las cuotas de las semanas que empiezan en el periodo. */
export async function cuotasPorCobrar(desde: Date, hasta: Date, casas: CasasMiradas) {
  const { _sum, _count } = await prisma.cuota.aggregate({
    _sum: { saldoPendiente: true },
    _count: true,
    where: {
      periodo: { gte: desde, lt: hasta },
      saldoPendiente: { gt: 0 },
      estado: { not: "PAGADA" },
      ...deLasCasas(casas),
    },
  });
  return { monto: _sum.saldoPendiente ?? 0, cuotas: _count };
}

/** Lo que todavía debe cada casa de las cuotas de las semanas que empiezan en el periodo (para el detalle por casa de la exportación). */
export async function deudaPorCasaDelPeriodo(desde: Date, hasta: Date, casas: CasasMiradas) {
  const filas = await prisma.cuota.groupBy({
    by: ["predioId"],
    _sum: { saldoPendiente: true },
    where: {
      periodo: { gte: desde, lt: hasta },
      saldoPendiente: { gt: 0 },
      estado: { not: "PAGADA" },
      ...deLasCasas(casas),
    },
  });
  return new Map(filas.map((f) => [f.predioId, f._sum.saldoPendiente ?? 0]));
}

/** El día y la hora del último recibo emitido: la última vez que se actualizaron las cuentas; `null` si todavía no hay ninguno. */
export async function fechaDelUltimoRecibo() {
  const { _max } = await prisma.recibo.aggregate({ _max: { fecha: true } });
  return _max.fecha;
}
