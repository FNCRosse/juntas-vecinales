import type { CuerpoDeError } from "@/compartido/manejar";

// Envía un formulario a un route handler y devuelve el resultado o el error en lenguaje llano.

export type Resultado<T> =
  { ok: true; datos: T } | { ok: false; estado: number; error: string; campos: Record<string, string> };

const SIN_RED = "No pudimos conectarnos. Revise su internet y vuelva a intentarlo.";

export async function enviarJson<T>(ruta: string, metodo: string, cuerpo?: unknown): Promise<Resultado<T>> {
  try {
    const respuesta = await fetch(ruta, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    if (respuesta.ok) {
      return { ok: true, datos: (respuesta.status === 204 ? null : await respuesta.json()) as T };
    }
    const error = (await respuesta.json().catch(() => ({ error: SIN_RED }))) as CuerpoDeError;
    return { ok: false, estado: respuesta.status, error: error.error, campos: error.campos ?? {} };
  } catch {
    return { ok: false, estado: 0, error: SIN_RED, campos: {} };
  }
}
