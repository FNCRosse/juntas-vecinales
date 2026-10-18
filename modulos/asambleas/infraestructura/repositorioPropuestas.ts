// @HU-ASA-13
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

export const propuestaPorIdOperacion = (idOperacion: string) =>
  prisma.propuestaAgenda.findUnique({ where: { idOperacion } });

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
