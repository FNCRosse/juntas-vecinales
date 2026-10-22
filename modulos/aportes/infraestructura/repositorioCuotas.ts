// @HU-COB-01
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { Linea } from "@/modulos/aportes/dominio/cuota";

const conConceptos = { conceptos: { orderBy: { orden: "asc" } } } as const;

/** Para cada casa, el periodo de su última cuota emitida (para saber qué semanas faltan). */
export async function ultimoPeriodoPorCasa() {
  const filas = await prisma.cuota.groupBy({ by: ["predioId"], _max: { periodo: true } });
  return new Map(filas.map((f) => [f.predioId, f._max.periodo]));
}

export const crearCuota = (
  tx: Transaccion,
  datos: {
    predioId: string;
    periodo: Date;
    fechaLimite: Date;
    tarifaId: string;
    monto: number;
    lineas: Linea[];
  },
) =>
  tx.cuota.create({
    data: {
      predioId: datos.predioId,
      periodo: datos.periodo,
      fechaLimite: datos.fechaLimite,
      tarifaId: datos.tarifaId,
      montoCalculado: datos.monto,
      saldoPendiente: datos.monto,
      conceptos: {
        create: datos.lineas.map((l, orden) => ({
          clave: l.clave,
          nombre: l.nombre,
          unidad: l.unidad,
          montoUnitario: l.montoUnitario,
          cantidad: l.cantidad,
          subtotal: l.subtotal,
          orden,
        })),
      },
    },
  });

/** Las cuotas con saldo que ya pasaron su fecha límite pasan a VENCIDA. Devuelve cuántas. */
export async function marcarVencidas(ahora: Date) {
  const { count } = await prisma.cuota.updateMany({
    where: { estado: "PENDIENTE", fechaLimite: { lt: ahora } },
    data: { estado: "VENCIDA" },
  });
  return count;
}

/** Las cuotas de una casa que todavía se deben, de la más antigua a la más nueva. */
export const cuotasPorPagarDe = (predioId: string) =>
  prisma.cuota.findMany({
    where: { predioId, estado: { not: "PAGADA" } },
    include: conConceptos,
    orderBy: { periodo: "asc" },
  });

/** La cuota más reciente de una casa, con sus conceptos: lo que se le cobra por semana. */
export const ultimaCuotaDe = (predioId: string) =>
  prisma.cuota.findFirst({ where: { predioId }, include: conConceptos, orderBy: { periodo: "desc" } });

/** Las cuotas de una casa que ya se pagaron, de la más reciente a la más antigua. */
export const cuotasPagadasDe = (predioId: string) =>
  prisma.cuota.findMany({ where: { predioId, estado: "PAGADA" }, orderBy: { periodo: "desc" }, take: 100 });
