// @HU-ASA-07
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

export const checkInsDe = (convocatoriaId: string) =>
  prisma.checkInPresencial.findMany({ where: { convocatoriaId }, orderBy: { creadoEn: "desc" } });

export const delegacionesDe = (convocatoriaId: string) =>
  prisma.delegacionVoto.findMany({ where: { convocatoriaId }, orderBy: { numero: "asc" } });

/** Marca a una casa como presente. Idempotente por el par asamblea–casa (AC-5). */
export const marcarPresente = (
  tx: Transaccion,
  datos: { convocatoriaId: string; predioId: string; acreditadoPor: string },
) =>
  tx.checkInPresencial.upsert({
    where: { convocatoriaId_predioId: { convocatoriaId: datos.convocatoriaId, predioId: datos.predioId } },
    create: datos,
    update: {},
  });

/** Valida un poder en la puerta. Devuelve si este intento lo validó (si ya estaba validado, no lo repite). */
export async function validarPoder(
  tx: Transaccion,
  datos: { convocatoriaId: string; delegacionId: string; validadaPor: string; ahora: Date },
) {
  const { count } = await tx.delegacionVoto.updateMany({
    where: { id: datos.delegacionId, convocatoriaId: datos.convocatoriaId, validadaEn: null },
    data: { validadaEn: datos.ahora, validadaPor: datos.validadaPor },
  });
  return count === 1;
}

/** Marca las votaciones como abiertas. Devuelve si este intento las abrió (si ya estaban, no las reabre). */
export async function abrirVotaciones(tx: Transaccion, convocatoriaId: string, ahora: Date) {
  const { count } = await tx.asamblea.updateMany({
    where: { convocatoriaId, votacionesAbiertasEn: null },
    data: { votacionesAbiertasEn: ahora },
  });
  return count === 1;
}
