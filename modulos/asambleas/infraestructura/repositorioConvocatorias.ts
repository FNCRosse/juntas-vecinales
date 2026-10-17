// @HU-ASA-01
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { TipoAsamblea } from "@/compartido/bd/generado/client";

const conAsamblea = { asamblea: true } as const;

export async function buscarPorIdOperacion(idOperacion: string) {
  return prisma.convocatoria.findUnique({ where: { idOperacion }, include: conAsamblea });
}

export async function crearAsamblea(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    tipoAsamblea: TipoAsamblea;
    fechaHora: Date;
    lugar: string;
    motivo: string;
    padronTotal: number;
    quorumRequerido: number;
    confirmacionesHasta: Date;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
  },
) {
  const { tipoAsamblea, padronTotal, quorumRequerido, confirmacionesHasta, ...convocatoria } = datos;
  return tx.convocatoria.create({
    data: {
      ...convocatoria,
      tipo: "ASAMBLEA",
      estado: "PUBLICADA",
      asamblea: { create: { tipoAsamblea, padronTotal, quorumRequerido, confirmacionesHasta } },
    },
    include: conAsamblea,
  });
}

export async function buscarAsamblea(id: string) {
  return prisma.convocatoria.findFirst({
    where: { id, tipo: "ASAMBLEA" },
    include: conAsamblea,
  });
}

/** Las asambleas convocadas, de la más próxima a la más lejana por su fecha. */
export async function listarAsambleas() {
  return prisma.convocatoria.findMany({
    where: { tipo: "ASAMBLEA" },
    include: conAsamblea,
    orderBy: { fechaHora: "asc" },
    take: 100,
  });
}
