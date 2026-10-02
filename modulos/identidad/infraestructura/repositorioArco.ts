import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoArco, Prisma, TipoArco } from "@/compartido/bd/generado/client";

const CON_VECINO = {
  usuario: {
    include: { residencias: { where: { fechaFin: null }, include: { predio: true }, take: 1 } },
  },
} as const;

export async function crearSolicitud(tx: Transaccion, datos: Prisma.SolicitudArcoUncheckedCreateInput) {
  return tx.solicitudArco.create({ data: datos });
}

export async function solicitudesDelVecino(usuarioId: string) {
  return prisma.solicitudArco.findMany({ where: { usuarioId }, orderBy: { creadaEn: "desc" }, take: 10 });
}

export async function pendienteDelMismoCampo(
  usuarioId: string,
  campo: Prisma.SolicitudArcoWhereInput["campo"],
) {
  return prisma.solicitudArco.findFirst({
    where: { usuarioId, estado: "PENDIENTE", tipo: "RECTIFICACION", campo },
  });
}

export async function solicitudesParaLaBandeja(tipo?: TipoArco) {
  return prisma.solicitudArco.findMany({
    where: tipo ? { tipo } : {},
    include: CON_VECINO,
    orderBy: [{ creadaEn: "desc" }],
    take: 100,
  });
}

export async function solicitudConVecino(id: string) {
  return prisma.solicitudArco.findUnique({ where: { id }, include: CON_VECINO });
}

export async function contarPendientes() {
  return prisma.solicitudArco.findMany({
    where: { estado: "PENDIENTE" },
    select: { tipo: true, creadaEn: true },
  });
}

/** Cierra la solicitud solo si sigue pendiente: dos administradores no la resuelven dos veces. */
export async function cerrarSolicitud(
  tx: Transaccion,
  id: string,
  datos: { estado: EstadoArco; resueltaEn: Date; resueltaPor: string; motivoResolucion: string | null },
) {
  const { count } = await tx.solicitudArco.updateMany({ where: { id, estado: "PENDIENTE" }, data: datos });
  return count === 1;
}

export async function nombreDeUsuario(id: string | null) {
  if (!id) return null;
  return (
    (await prisma.usuario.findUnique({ where: { id }, select: { nombreCompleto: true } }))?.nombreCompleto ??
    null
  );
}
