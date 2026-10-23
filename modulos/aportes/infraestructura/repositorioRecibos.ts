// @HU-COB-12
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { FranjaDeVisita } from "@/compartido/bd/generado/client";

export const crearRecibo = (
  tx: Transaccion,
  datos: {
    pagoId: string;
    predioId: string;
    titular: string;
    vivienda: string;
    concepto: string;
    medio: string;
    monto: number;
    fecha: Date;
    registradoPor: string;
    registradoPorId: string;
  },
) => tx.recibo.create({ data: datos });

export const reciboDelPago = (pagoId: string) => prisma.recibo.findUnique({ where: { pagoId } });

/** Un recibo con el pago que lo originó, para saber a quién avisar. */
export const reciboPorId = (id: string) =>
  prisma.recibo.findUnique({ where: { id }, include: { pago: { select: { autorId: true } } } });

/** Un recibo de esa casa, solo si ya se lo enviaron a la app: otra casa no lo encuentra (AC-7). */
export const reciboEnviadoDeLaCasa = (predioId: string, id: string) =>
  prisma.recibo.findFirst({
    where: { id, predioId, enviadoEn: { not: null } },
    include: { pedidos: { where: { estado: "POR_ENTREGAR" }, select: { id: true } } },
  });

export const recibosEnviadosDe = (predioId: string) =>
  prisma.recibo.findMany({
    where: { predioId, enviadoEn: { not: null } },
    include: { pedidos: { where: { estado: "POR_ENTREGAR" }, select: { id: true } } },
    orderBy: { fecha: "desc" },
    take: 100,
  });

/** Anota el envío a la app con un UPDATE condicionado: enviarlo dos veces no avisa dos veces (AC-5). */
export async function reclamarEnvio(tx: Transaccion, id: string, ahora: Date) {
  const { count } = await tx.recibo.updateMany({
    where: { id, enviadoEn: null },
    data: { enviadoEn: ahora },
  });
  return count === 1;
}

export async function reclamarConfirmacion(tx: Transaccion, id: string, ahora: Date) {
  const { count } = await tx.recibo.updateMany({
    where: { id, enviadoEn: { not: null }, confirmadoEn: null },
    data: { confirmadoEn: ahora },
  });
  return count === 1;
}

export const pedidoPorIdOperacion = (idOperacion: string) =>
  prisma.pedidoReciboPapel.findUnique({ where: { idOperacion }, include: { recibo: true } });

export const pedidoAbierto = (tx: Transaccion, reciboId: string) =>
  tx.pedidoReciboPapel.count({ where: { reciboId, estado: "POR_ENTREGAR" } });

export const crearPedido = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    reciboId: string;
    solicitanteId: string;
    franja: FranjaDeVisita;
    nota: string | null;
    creadoEn: Date;
  },
) => tx.pedidoReciboPapel.create({ data: datos, include: { recibo: true } });

export const pedidosPorEntregar = () =>
  prisma.pedidoReciboPapel.findMany({
    where: { estado: "POR_ENTREGAR" },
    include: { recibo: true },
    orderBy: { creadoEn: "desc" },
    take: 200,
  });

export const pedidoPorId = (id: string) => prisma.pedidoReciboPapel.findUnique({ where: { id } });

/** Marca el pedido entregado con un UPDATE condicionado: entregarlo dos veces cambia una sola vez (AC-5). */
export async function reclamarEntrega(tx: Transaccion, id: string, ahora: Date, entregadoPorId: string) {
  const { count } = await tx.pedidoReciboPapel.updateMany({
    where: { id, estado: "POR_ENTREGAR" },
    data: { estado: "ENTREGADO", entregadoEn: ahora, entregadoPorId },
  });
  return count === 1;
}
