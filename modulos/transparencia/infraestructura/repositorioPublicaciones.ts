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

const conActa = { acta: true } as const;

export async function buscarActaPorIdOperacion(idOperacion: string) {
  return prisma.publicacion.findFirst({ where: { idOperacion, tipo: "ACTA" }, include: conActa });
}

export async function crearActa(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    fechaAsamblea: Date;
    acuerdos: string[];
    compromisos: string[];
    conclusiones: string;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
  },
) {
  const { fechaAsamblea, acuerdos, compromisos, conclusiones, ...publicacion } = datos;
  return tx.publicacion.create({
    data: {
      ...publicacion,
      tipo: "ACTA",
      acta: { create: { fechaAsamblea, acuerdos, compromisos, conclusiones } },
    },
    include: conActa,
  });
}

export async function buscarActa(id: string) {
  return prisma.publicacion.findFirst({ where: { id, tipo: "ACTA" }, include: conActa });
}

export async function listarActas() {
  return prisma.publicacion.findMany({
    where: { tipo: "ACTA" },
    include: conActa,
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });
}
