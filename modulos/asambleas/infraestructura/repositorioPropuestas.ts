// @HU-ASA-13 @HU-ASA-14
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

export const propuestaPorIdOperacion = (idOperacion: string) =>
  prisma.propuestaAgenda.findUnique({ where: { idOperacion } });

export const buscarPropuesta = (id: string) => prisma.propuestaAgenda.findUnique({ where: { id } });

export const crearPropuesta = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    convocatoriaId: string;
    autorId: string;
    predioId: string;
    titulo: string;
    justificacion: string;
  },
) => tx.propuestaAgenda.create({ data: datos });

/** Las propuestas de una asamblea por fecha de envío, las más antiguas primero (HU-ASA-14 CA1). */
export const propuestasDe = (convocatoriaId: string) =>
  prisma.propuestaAgenda.findMany({ where: { convocatoriaId }, orderBy: { creadaEn: "asc" } });

/** Lo que propuso una persona en esa asamblea. */
export const propuestasDeAutor = (convocatoriaId: string, autorId: string) =>
  prisma.propuestaAgenda.findMany({ where: { convocatoriaId, autorId }, orderBy: { creadaEn: "asc" } });

/** Las propuestas incluidas en la agenda de una asamblea, por fecha de envío. */
export const propuestasIncluidas = (convocatoriaId: string) =>
  prisma.propuestaAgenda.findMany({
    where: { convocatoriaId, estado: "INCLUIDA" },
    orderBy: { creadaEn: "asc" },
  });

/** Registra la decisión sobre una propuesta pendiente. Devuelve si este intento la registró (HU-ASA-14, AC-5). */
export async function decidir(
  tx: Transaccion,
  datos: {
    id: string;
    estado: "INCLUIDA" | "NO_INCLUIDA";
    motivoDecision: string | null;
    decididaPor: string;
    ahora: Date;
  },
) {
  const { count } = await tx.propuestaAgenda.updateMany({
    where: { id: datos.id, estado: "PENDIENTE_REVISION" },
    data: {
      estado: datos.estado,
      motivoDecision: datos.motivoDecision,
      decididaPor: datos.decididaPor,
      decididaEn: datos.ahora,
    },
  });
  return count === 1;
}

/** «Cambiar la decisión»: la propuesta vuelve a pendiente de revisión. Devuelve si estaba decidida. */
export async function reabrir(tx: Transaccion, id: string) {
  const { count } = await tx.propuestaAgenda.updateMany({
    where: { id, estado: { not: "PENDIENTE_REVISION" } },
    data: { estado: "PENDIENTE_REVISION", motivoDecision: null, decididaPor: null, decididaEn: null },
  });
  return count === 1;
}
