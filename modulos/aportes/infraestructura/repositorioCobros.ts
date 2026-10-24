// @HU-COB-11
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { FranjaDeVisita } from "@/compartido/bd/generado/client";

export const pedidoDeCobroPorIdOperacion = (idOperacion: string) =>
  prisma.pedidoCobroEnCasa.findUnique({ where: { idOperacion } });

export const pedidoDeCobroPorId = (id: string) => prisma.pedidoCobroEnCasa.findUnique({ where: { id } });

/** El pedido de cobro en casa que la casa todavía tiene abierto (a lo más uno). */
export const pedidoPendienteDeLaCasa = (predioId: string) =>
  prisma.pedidoCobroEnCasa.findFirst({ where: { predioId, estado: "PENDIENTE" } });

export const hayPedidoPendiente = (tx: Transaccion, predioId: string) =>
  tx.pedidoCobroEnCasa.count({ where: { predioId, estado: "PENDIENTE" } });

export const crearPedidoDeCobro = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    predioId: string;
    solicitanteId: string;
    semanas: number;
    monto: number;
    franja: FranjaDeVisita;
    nota: string | null;
    creadoEn: Date;
  },
) => tx.pedidoCobroEnCasa.create({ data: datos });

/** Los pedidos de cobro en casa que esperan la visita de la directiva, el más reciente primero. */
export const pedidosDeCobroPendientes = () =>
  prisma.pedidoCobroEnCasa.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { creadoEn: "desc" },
    take: 200,
  });

/** La casa lo cancela con un UPDATE condicionado: cancelarlo dos veces cambia una sola vez (AC-5). */
export async function reclamarCancelacion(tx: Transaccion, id: string) {
  const { count } = await tx.pedidoCobroEnCasa.updateMany({
    where: { id, estado: "PENDIENTE" },
    data: { estado: "CANCELADO" },
  });
  return count === 1;
}

/** Enlaza el pedido con el pago que lo cobró; solo un cobro lo logra (AC-5). */
export async function reclamarCobro(tx: Transaccion, id: string, pagoId: string, cobradoEn: Date) {
  const { count } = await tx.pedidoCobroEnCasa.updateMany({
    where: { id, estado: "PENDIENTE" },
    data: { estado: "COBRADO", pagoId, cobradoEn },
  });
  return count === 1;
}
