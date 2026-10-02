import { prisma } from "../compartido/bd/cliente";
import { despacharAvisos } from "../compartido/notificaciones/despachar";

// Número fijo del advisory lock del worker. Se usa la variante de transacción
// (pg_try_advisory_xact_lock) porque la URL con pooling de Neon trabaja por transacción
// y un cerrojo de sesión podría quedar en otra conexión.
export const CERROJO_WORKER = 2026_0001;

export type ResultadoLlamada = { estado: "ejecutada"; id: string } | { estado: "ocupado" };

// La transacción solo sostiene el cerrojo; las tareas escriben con su propia conexión para que
// cada paso quede guardado aunque otro falle (la copia interna de un aviso antes de WhatsApp).
// Por debajo del --max-time 120 del cron.
const DURACION_MAXIMA_MS = 110_000;

/**
 * Toma el cerrojo, corre las tareas y registra la ejecución. Si otra llamada tiene el cerrojo,
 * termina sin efecto. Las tareas de deuda y morosidad llegan con M5.
 */
export async function ejecutarTareas(): Promise<ResultadoLlamada> {
  const iniciadaEn = new Date();
  try {
    return await prisma.$transaction(
      async (tx) => {
        const [{ obtenido }] = await tx.$queryRaw<{ obtenido: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${CERROJO_WORKER}) AS obtenido`;
        if (!obtenido) return { estado: "ocupado" } as const;

        const avisos = await despacharAvisos();

        const ejecucion = await tx.ejecucionWorker.create({
          data: {
            iniciadaEn,
            terminadaEn: new Date(),
            resultado: "EXITOSA",
            detalle: JSON.stringify({ avisos }),
          },
        });
        return { estado: "ejecutada", id: ejecucion.id } as const;
      },
      { timeout: DURACION_MAXIMA_MS, maxWait: 10_000 },
    );
  } catch (error) {
    await prisma.ejecucionWorker.create({
      data: { iniciadaEn, terminadaEn: new Date(), resultado: "FALLIDA", detalle: String(error) },
    });
    throw error;
  }
}
