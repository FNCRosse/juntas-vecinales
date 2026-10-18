// @HU-ASA-09
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

export const voluntariadoPorIdOperacion = (idOperacion: string) =>
  prisma.voluntariado.findUnique({ where: { idOperacion } });

export const voluntariadoDePredio = (convocatoriaId: string, predioId: string) =>
  prisma.voluntariado.findUnique({ where: { convocatoriaId_predioId: { convocatoriaId, predioId } } });

export const buscarVoluntariado = (id: string) => prisma.voluntariado.findUnique({ where: { id } });

/** Los ofrecimientos de ayuda de una actividad, los más antiguos primero. */
export const voluntariosDe = (convocatoriaId: string) =>
  prisma.voluntariado.findMany({ where: { convocatoriaId }, orderBy: { creadaEn: "asc" } });

export const crearVoluntariado = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    convocatoriaId: string;
    predioId: string;
    autorId: string;
    descripcion: string;
  },
) => tx.voluntariado.create({ data: datos });

/** Registra la decisión sobre un ofrecimiento pendiente. Devuelve si este intento la registró (AC-5). */
export async function decidirVoluntariado(
  tx: Transaccion,
  datos: {
    id: string;
    estado: "APROBADO" | "NO_APROBADO";
    rolAsignado: string | null;
    decididoPor: string;
    ahora: Date;
  },
) {
  const { count } = await tx.voluntariado.updateMany({
    where: { id: datos.id, estado: "PENDIENTE" },
    data: {
      estado: datos.estado,
      rolAsignado: datos.rolAsignado,
      decididoPor: datos.decididoPor,
      decididoEn: datos.ahora,
    },
  });
  return count === 1;
}
