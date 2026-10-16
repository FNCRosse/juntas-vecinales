import { prisma } from "../bd/cliente";
import type { TipoAviso } from "../bd/generado/client";
import { ErrorNoEncontrado } from "../errores";

// Centro de notificaciones (HU-GAR-20): la copia interna de cada aviso, solo de quien pregunta (AC-7).

export async function listarNotificaciones(destinatarioId: string, tipos?: TipoAviso[]) {
  return prisma.notificacion.findMany({
    where: { destinatarioId, ...(tipos && { tipo: { in: tipos } }) },
    orderBy: { creadaEn: "desc" },
    take: 100,
  });
}

export async function contarNoLeidas(destinatarioId: string) {
  return prisma.notificacion.count({ where: { destinatarioId, leidaEn: null } });
}

/** Una notificación de otra persona responde igual que una que no existe (AC-7). */
export async function marcarLeida(destinatarioId: string, id: string, ahora = new Date()) {
  const { count } = await prisma.notificacion.updateMany({
    where: { id, destinatarioId },
    data: { leidaEn: ahora },
  });
  if (!count) throw new ErrorNoEncontrado();
}

/** Devuelve cuáles eran, para poder deshacerlo (HU-ACC-03 CA4). */
export async function marcarTodasLeidas(destinatarioId: string, ahora = new Date()) {
  return prisma.$transaction(async (tx) => {
    const ids = (
      await tx.notificacion.findMany({ where: { destinatarioId, leidaEn: null }, select: { id: true } })
    ).map((n) => n.id);
    await tx.notificacion.updateMany({ where: { id: { in: ids } }, data: { leidaEn: ahora } });
    return ids;
  });
}

/** Deshacer "marcar como leído": solo las de quien pregunta; las demás se ignoran (AC-7). */
export async function marcarNoLeidas(destinatarioId: string, ids: string[]) {
  await prisma.notificacion.updateMany({
    where: { id: { in: ids }, destinatarioId },
    data: { leidaEn: null },
  });
}
