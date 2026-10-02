import { prisma } from "../compartido/bd/cliente";

// Número fijo del advisory lock del worker. Se usa la variante de transacción
// (pg_try_advisory_xact_lock) porque la URL con pooling de Neon trabaja por transacción
// y un cerrojo de sesión podría quedar en otra conexión.
export const CERROJO_WORKER = 2026_0001;

export type ResultadoLlamada = { estado: "ejecutada"; id: string } | { estado: "ocupado" };

/**
 * Toma el cerrojo y registra la ejecución. Si otra llamada lo tiene, termina sin efecto.
 * Las tareas (deuda, morosidad, despacho de avisos) llegan con sus fases.
 */
export async function ejecutarTareas(): Promise<ResultadoLlamada> {
  const iniciadaEn = new Date();
  try {
    return await prisma.$transaction(async (tx) => {
      const [{ obtenido }] = await tx.$queryRaw<{ obtenido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${CERROJO_WORKER}) AS obtenido`;
      if (!obtenido) return { estado: "ocupado" } as const;

      const ejecucion = await tx.ejecucionWorker.create({
        data: { iniciadaEn, terminadaEn: new Date(), resultado: "EXITOSA" },
      });
      return { estado: "ejecutada", id: ejecucion.id } as const;
    });
  } catch (error) {
    await prisma.ejecucionWorker.create({
      data: { iniciadaEn, terminadaEn: new Date(), resultado: "FALLIDA", detalle: String(error) },
    });
    throw error;
  }
}
