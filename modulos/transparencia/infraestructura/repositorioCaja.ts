// @HU-COB-14
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { TipoMovimiento } from "@/compartido/bd/generado/client";

/** Los movimientos de la caja entre dos instantes (`hasta` no entra), del más nuevo al más antiguo. */
export const movimientosEntre = (desde: Date, hasta: Date) =>
  prisma.movimientoDeCaja.findMany({
    where: { fecha: { gte: desde, lt: hasta } },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
    take: 500,
  });

export const movimientoPorIdOperacion = (idOperacion: string) =>
  prisma.movimientoDeCaja.findUnique({ where: { idOperacion } });

export const crearMovimiento = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    tipo: TipoMovimiento;
    concepto: string;
    detalle: string | null;
    monto: number;
    fecha: Date;
    archivoId: string | null;
    autorId: string;
    autor: string;
  },
) => tx.movimientoDeCaja.create({ data: datos });

export const rendicionDelMes = (mes: string) => prisma.rendicionPublicada.findUnique({ where: { mes } });

export const rendicionPorIdOperacion = (idOperacion: string) =>
  prisma.rendicionPublicada.findUnique({ where: { idOperacion } });

/** Una rendición del mes ya publicada, leída dentro de la transacción que decide si se puede agregar o publicar algo. */
export const rendicionDelMesEn = (tx: Transaccion, mes: string) =>
  tx.rendicionPublicada.findUnique({ where: { mes } });

export const crearRendicion = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    mes: string;
    ingresosPorCuotas: number;
    ingresosOtros: number;
    gastos: number;
    comprobantes: number;
    gastosPorConcepto: { concepto: string; monto: number }[];
    publicadaPorId: string;
    publicadaPor: string;
    publicadaEn: Date;
  },
) => tx.rendicionPublicada.create({ data: datos });

/** Serializa quien registra un movimiento y quien publica ese mes: así no se agrega un gasto a una rendición que se está publicando. */
export async function bloquearMes(tx: Transaccion, mes: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`rendicion:${mes}`}))`;
}
