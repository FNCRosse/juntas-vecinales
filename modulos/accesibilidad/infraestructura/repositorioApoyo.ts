import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoApoyo, ModoApoyo } from "@/modulos/accesibilidad/dominio/canalMediacionHumana";

export async function crearSolicitud(
  tx: Transaccion,
  datos: { usuarioId: string; quien: string; pantalla: string; modo: ModoApoyo; detalle?: string },
) {
  return tx.solicitudApoyo.create({ data: datos });
}

export async function solicitudesDe(usuarioId: string) {
  return prisma.solicitudApoyo.findMany({ where: { usuarioId }, orderBy: { creadaEn: "desc" }, take: 20 });
}

/** Primero las pendientes y en atención, luego las atendidas; dentro, las más antiguas arriba. */
export async function solicitudesParaAtender() {
  const filas = await prisma.solicitudApoyo.findMany({ orderBy: { creadaEn: "asc" }, take: 100 });
  return [
    ...filas.filter((f) => f.estado !== "ATENDIDA"),
    ...filas.filter((f) => f.estado === "ATENDIDA").reverse(),
  ];
}

export async function buscarSolicitud(id: string) {
  return prisma.solicitudApoyo.findUnique({ where: { id } });
}

export async function guardarEstado(id: string, estado: EstadoApoyo, atendidaPor: string) {
  return prisma.solicitudApoyo.update({ where: { id }, data: { estado, atendidaPor } });
}

/** Cancelación aprobada (HU-GAR-14 CA3): los pedidos de ayuda quedan sin el nombre ni el detalle. */
export async function anonimizarPedidos(tx: Transaccion, usuarioId: string, quien: string) {
  await tx.solicitudApoyo.updateMany({ where: { usuarioId }, data: { quien, detalle: null } });
}
