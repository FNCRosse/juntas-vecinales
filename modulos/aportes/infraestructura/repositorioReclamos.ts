// @HU-COB-03
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { MotivoReclamo } from "@/compartido/bd/generado/client";

export const reclamoPorIdOperacion = (idOperacion: string) =>
  prisma.solicitudAjusteTarifa.findUnique({ where: { idOperacion } });

/** El reclamo de esa casa, solo si es suyo: otra casa no lo encuentra (AC-7). */
export const reclamoDeLaCasa = (predioId: string, id: string) =>
  prisma.solicitudAjusteTarifa.findFirst({ where: { id, predioId } });

export const reclamoPorId = (id: string) => prisma.solicitudAjusteTarifa.findUnique({ where: { id } });

/** Los reclamos que esperan la respuesta de la directiva, el más reciente primero. */
export const reclamosEnRevision = () =>
  prisma.solicitudAjusteTarifa.findMany({
    where: { estado: "EN_REVISION" },
    orderBy: { creadoEn: "desc" },
    take: 200,
  });

/** Cuántos reclamos ya respondidos tiene la casa (antecedentes del reclamo que se revisa). */
export const reclamosRespondidosDe = (predioId: string) =>
  prisma.solicitudAjusteTarifa.count({ where: { predioId, estado: { not: "EN_REVISION" } } });

/** El reclamo que la casa todavía tiene en revisión (a lo más uno). */
export const reclamoEnRevisionDe = (predioId: string) =>
  prisma.solicitudAjusteTarifa.findFirst({ where: { predioId, estado: "EN_REVISION" } });

export const hayReclamoEnRevision = (tx: Transaccion, predioId: string) =>
  tx.solicitudAjusteTarifa.count({ where: { predioId, estado: "EN_REVISION" } });

/** Las cuotas de la casa que se pueden reclamar: las que debe y que no están ya en discrepancia. */
export const cuotasReclamables = (tx: Transaccion, predioId: string) =>
  tx.cuota.findMany({
    where: { predioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, saldoPendiente: { gt: 0 } },
    orderBy: { periodo: "asc" },
  });

/** Cuántas cuotas de la casa se podrían reclamar ahora. */
export const cuantasCuotasReclamables = (predioId: string) =>
  prisma.cuota.count({
    where: { predioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, saldoPendiente: { gt: 0 } },
  });

/** Crea el reclamo y pone en discrepancia las cuotas que cubre, guardando el estado en que estaban. */
export async function crearReclamo(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    predioId: string;
    solicitanteId: string;
    motivo: MotivoReclamo;
    detalle: string | null;
    archivoId: string | null;
    creadoEn: Date;
    cuotas: { id: string; estado: "PENDIENTE" | "VENCIDA" }[];
  },
) {
  const { cuotas, ...resto } = datos;
  const reclamo = await tx.solicitudAjusteTarifa.create({
    data: { ...resto, cuotas: { create: cuotas.map((c) => ({ cuotaId: c.id, estadoAnterior: c.estado })) } },
  });
  await tx.cuota.updateMany({
    where: { id: { in: cuotas.map((c) => c.id) } },
    data: { estado: "EN_DISCREPANCIA" },
  });
  return reclamo;
}
