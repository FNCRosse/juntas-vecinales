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

export async function marcarTodasLeidas(destinatarioId: string, ahora = new Date()) {
  await prisma.notificacion.updateMany({
    where: { destinatarioId, leidaEn: null },
    data: { leidaEn: ahora },
  });
}
