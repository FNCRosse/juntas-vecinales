import { prisma } from "../bd/cliente";
import type { Prisma } from "../bd/generado/client";

/**
 * Lee la auditoría de la más reciente a la más antigua, con filtros (HU-GAR-26 CA1 y CA2). Solo
 * lectura: la tabla no admite cambios (CA3). `antesDe` pagina hacia atrás.
 */
export async function leerAuditoria(filtros: {
  acciones?: string[];
  /** Un id de usuario, o null para lo que hizo el sistema. */
  actorId?: string | null;
  antesDe?: Date;
  limite: number;
}) {
  const where: Prisma.RegistroAuditoriaWhereInput = {};
  if (filtros.acciones) where.accion = { in: filtros.acciones };
  if (filtros.actorId !== undefined) where.actorId = filtros.actorId;
  if (filtros.antesDe) where.fecha = { lt: filtros.antesDe };
  return prisma.registroAuditoria.findMany({
    where,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    take: filtros.limite,
  });
}

/** Quiénes aparecen en la auditoría, para el filtro por responsable. */
export async function actoresDeAuditoria() {
  const filas = await prisma.registroAuditoria.findMany({ distinct: ["actorId"], select: { actorId: true } });
  return filas.map((f) => f.actorId);
}
