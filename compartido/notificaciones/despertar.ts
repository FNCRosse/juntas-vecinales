/**
 * Pide al worker que despache la cola ya, sin esperar al cron (docs/BACKEND.md §8): el enlace de
 * entrada vence en 15 minutos. Si falla o no está configurado, el cron lo envía después.
 */
export async function despertarWorker(url = process.env.URL_WORKER, secreto = process.env.SECRETO_WORKER) {
  if (!url || !secreto) return false;
  try {
    const respuesta = await fetch(`${url}/tareas/ejecutar`, {
      method: "POST",
      headers: { "x-secreto-worker": secreto },
      signal: AbortSignal.timeout(90_000),
    });
    return respuesta.ok;
  } catch (error) {
    console.error("No se pudo despertar al worker", error);
    return false;
  }
}
