import { prisma } from "@/compartido/bd/cliente";

export async function crearSesion(usuarioId: string, tokenHash: string) {
  await prisma.sesion.create({ data: { usuarioId, tokenHash } });
}

/** Sesión vigente: no revocada y de un usuario activo. */
export async function buscarSesionVigente(tokenHash: string) {
  return prisma.sesion.findFirst({
    where: { tokenHash, revocadaEn: null, usuario: { estado: "ACTIVA" } },
    include: { usuario: { select: { id: true, nombreCompleto: true, roles: true } } },
  });
}

export async function marcarUso(id: string, ahora: Date) {
  await prisma.sesion.update({ where: { id }, data: { ultimoUsoEn: ahora } });
}

export async function revocarSesion(tokenHash: string, ahora: Date) {
  await prisma.sesion.updateMany({ where: { tokenHash, revocadaEn: null }, data: { revocadaEn: ahora } });
}
