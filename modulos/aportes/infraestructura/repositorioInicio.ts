// @HU-GAR-19
import { prisma } from "@/compartido/bd/cliente";

/** Cuántas cosas de cobros esperan a la directiva: lo mismo que lista Cobros, contado sin traer las filas. */
export async function contarPorAtender() {
  const [comprobantes, cobrosEnCasa, reclamos, recibosEnPapel] = await Promise.all([
    prisma.pago.count({ where: { estado: "REGISTRADO" } }),
    prisma.pedidoCobroEnCasa.count({ where: { estado: "PENDIENTE" } }),
    prisma.solicitudAjusteTarifa.count({ where: { estado: "EN_REVISION" } }),
    prisma.pedidoReciboPapel.count({ where: { estado: "POR_ENTREGAR" } }),
  ]);
  return { comprobantes, cobrosEnCasa, reclamos, recibosEnPapel };
}
