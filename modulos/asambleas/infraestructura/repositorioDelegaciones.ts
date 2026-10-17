// @HU-ASA-06
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { CondicionApoderado } from "@/compartido/bd/generado/client";

export const delegacionDePredio = (convocatoriaId: string, predioId: string) =>
  prisma.delegacionVoto.findUnique({ where: { convocatoriaId_predioId: { convocatoriaId, predioId } } });

/**
 * Serializa las delegaciones al mismo apoderado en una asamblea: sin este candado, dos titulares que delegan a la
 * vez en la misma persona podrían pasarse del límite (cada uno vería una cuenta por debajo). Se libera al terminar.
 */
export async function bloquearApoderado(tx: Transaccion, convocatoriaId: string, dniHash: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`delegacion:${convocatoriaId}:${dniHash}`}))`;
}

/** Cuántas casas representa ya esa persona en esta asamblea. */
export const contarRepresentaciones = (tx: Transaccion, convocatoriaId: string, apoderadoDniHash: string) =>
  tx.delegacionVoto.count({ where: { convocatoriaId, apoderadoDniHash } });

export const crearDelegacion = (
  tx: Transaccion,
  datos: {
    convocatoriaId: string;
    predioId: string;
    titularId: string;
    apoderadoNombre: string;
    apoderadoDniHash: string;
    apoderadoDniFinal: string;
    condicion: CondicionApoderado;
  },
) => tx.delegacionVoto.create({ data: datos });

export const borrarDelegacion = (tx: Transaccion, convocatoriaId: string, predioId: string) =>
  tx.delegacionVoto.deleteMany({ where: { convocatoriaId, predioId } });
