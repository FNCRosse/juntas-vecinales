import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoGuia, SeccionGuia } from "@/compartido/bd/generado/client";

export async function guiasDe(usuarioId: string) {
  return prisma.guiaSeccion.findMany({ where: { usuarioId } });
}

export async function guardarGuia(usuarioId: string, seccion: SeccionGuia, estado: EstadoGuia, paso: number) {
  return prisma.guiaSeccion.upsert({
    where: { usuarioId_seccion: { usuarioId, seccion } },
    create: { usuarioId, seccion, estado, paso },
    update: { estado, paso },
  });
}

export async function borrarGuiasDe(tx: Transaccion, usuarioId: string) {
  await tx.guiaSeccion.deleteMany({ where: { usuarioId } });
}
