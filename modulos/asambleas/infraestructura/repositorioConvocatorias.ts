// @HU-ASA-01
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { ModoConfirmacion, TipoAsamblea } from "@/compartido/bd/generado/client";

const conAsamblea = {
  asamblea: true,
  confirmaciones: { select: { modo: true, predioId: true } },
} as const;

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

export async function confirmacionDePredio(convocatoriaId: string, predioId: string) {
  return prisma.confirmacionAsistencia.findUnique({
    where: { convocatoriaId_predioId: { convocatoriaId, predioId } },
  });
}

/** Confirma (o reafirma) la asistencia de un predio. Idempotente por el par convocatoria–predio (AC-5). */
export async function confirmarAsistencia(
  tx: Transaccion,
  datos: { convocatoriaId: string; predioId: string; modo: ModoConfirmacion; registradaPor: string | null },
) {
  return tx.confirmacionAsistencia.upsert({
    where: {
      convocatoriaId_predioId: { convocatoriaId: datos.convocatoriaId, predioId: datos.predioId },
    },
    create: datos,
    update: { modo: datos.modo, registradaPor: datos.registradaPor },
  });
}

export async function cancelarConfirmacion(tx: Transaccion, convocatoriaId: string, predioId: string) {
  await tx.confirmacionAsistencia.deleteMany({ where: { convocatoriaId, predioId } });
}

/** Asambleas publicadas cuyo plazo para confirmar ya cerró y a las que aún no se avisó el resultado. */
export async function asambleasEnElCorte(ahora: Date) {
  return prisma.convocatoria.findMany({
    where: {
      tipo: "ASAMBLEA",
      estado: { in: ["PUBLICADA", "REPROGRAMADA"] },
      asamblea: { is: { confirmacionesHasta: { lte: ahora }, avisoCorteEn: null } },
    },
    include: conAsamblea,
    orderBy: { fechaHora: "asc" },
  });
}

/**
 * Reclama el aviso de corte: solo uno de los que intenten a la vez lo logra, porque el UPDATE exige que
 * siga sin marcar. Devuelve si este intento lo obtuvo.
 */
export async function reclamarAvisoDeCorte(tx: Transaccion, convocatoriaId: string, ahora: Date) {
  const { count } = await tx.asamblea.updateMany({
    where: { convocatoriaId, avisoCorteEn: null },
    data: { avisoCorteEn: ahora },
  });
  return count === 1;
}

/** Pasa la asamblea a otra fecha: queda REPROGRAMADA, con su nuevo plazo y el aviso de corte por hacer otra vez. */
export async function reprogramarAsamblea(
  tx: Transaccion,
  id: string,
  datos: { fechaHora: Date; confirmacionesHasta: Date },
) {
  await tx.convocatoria.update({
    where: { id },
    data: {
      fechaHora: datos.fechaHora,
      estado: "REPROGRAMADA",
      asamblea: { update: { confirmacionesHasta: datos.confirmacionesHasta, avisoCorteEn: null } },
    },
  });
}

/** La asamblea sigue en pie pero sin votaciones ni acuerdos resolutivos. */
export async function convertirEnInformativa(tx: Transaccion, id: string) {
  await tx.convocatoria.update({ where: { id }, data: { estado: "INFORMATIVA" } });
}
