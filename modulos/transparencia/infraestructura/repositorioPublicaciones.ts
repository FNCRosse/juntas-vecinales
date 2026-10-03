import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { NivelUrgencia } from "@/compartido/bd/generado/client";

const conComunicado = { comunicado: true } as const;

export async function buscarPorIdOperacion(idOperacion: string) {
  return prisma.publicacion.findUnique({ where: { idOperacion }, include: conComunicado });
}

export async function crearComunicado(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    cuerpo: string;
    urgencia: NivelUrgencia;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
  },
) {
  const { cuerpo, urgencia, ...publicacion } = datos;
  return tx.publicacion.create({
    data: { ...publicacion, tipo: "COMUNICADO", comunicado: { create: { cuerpo, urgencia } } },
    include: conComunicado,
  });
}

/** Los comunicados publicados hasta ahora: el orden del feed lo da el dominio. */
export async function listarComunicados() {
  return prisma.publicacion.findMany({
    where: { tipo: "COMUNICADO" },
    include: conComunicado,
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });
}
