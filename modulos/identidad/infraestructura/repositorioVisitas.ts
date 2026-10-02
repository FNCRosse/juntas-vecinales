import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoGarita } from "@/compartido/bd/generado/client";

/** La vivienda donde vive hoy la persona, con su estado en la garita. */
export async function viviendaDe(usuarioId: string) {
  const residencia = await prisma.residencia.findFirst({
    where: { usuarioId, fechaFin: null },
    include: { predio: true },
  });
  return residencia?.predio ?? null;
}

export async function visitasDelPredio(predioId: string, desde: Date) {
  return prisma.visita.findMany({
    where: { predioId, OR: [{ hasta: { gte: desde } }, { llegoEn: { gte: desde } }] },
    orderBy: { desde: "asc" },
  });
}

export async function crearVisita(datos: {
  predioId: string;
  registradaPor: string;
  nombre: string;
  dni: string | null;
  desde: Date;
  hasta: Date;
  conVehiculo: boolean;
  placa: string | null;
}) {
  return prisma.visita.create({ data: datos });
}

/** La visita solo si es de ese predio: la de otra casa responde como inexistente (AC-7). */
export async function visitaDelPredio(id: string, predioId: string) {
  return prisma.visita.findFirst({ where: { id, predioId } });
}

export async function anular(id: string, ahora: Date) {
  return prisma.visita.update({ where: { id }, data: { estado: "ANULADA", anuladaEn: ahora } });
}

export async function guardarEstadoGarita(tx: Transaccion, predioId: string, estado: EstadoGarita) {
  await tx.predio.update({ where: { id: predioId }, data: { estadoGarita: estado } });
}
