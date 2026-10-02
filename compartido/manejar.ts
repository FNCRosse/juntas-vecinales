import { ZodError } from "zod";
import { ErrorDeAplicacion, ErrorValidacion, MENSAJE_ERROR_INESPERADO } from "./errores";

type Manejador<C> = (peticion: Request, contexto: C) => Promise<Response>;

export type CuerpoDeError = { error: string; campos?: Record<string, string> };

function responderError(error: unknown): Response {
  if (error instanceof ZodError) {
    const campos: Record<string, string> = {};
    for (const problema of error.issues) campos[problema.path.join(".") || "_"] ??= problema.message;
    return responderError(new ErrorValidacion(undefined, campos));
  }
  if (error instanceof ErrorDeAplicacion) {
    const cuerpo: CuerpoDeError = { error: error.mensaje };
    if (error instanceof ErrorValidacion && Object.keys(error.campos).length) cuerpo.campos = error.campos;
    return Response.json(cuerpo, { status: error.estadoHttp });
  }
  console.error("Error no controlado", error);
  return Response.json({ error: MENSAJE_ERROR_INESPERADO } satisfies CuerpoDeError, { status: 500 });
}

/**
 * Envoltorio de todos los route handlers: traduce los errores tipados y los de zod a su código
 * HTTP con un mensaje en lenguaje llano; cualquier otro error es 500 y queda en el log.
 */
export function manejar<C = unknown>(manejador: Manejador<C>): Manejador<C> {
  return async (peticion, contexto) => {
    try {
      return await manejador(peticion, contexto);
    } catch (error) {
      return responderError(error);
    }
  };
}

/** Lee el cuerpo JSON; si no es JSON válido, es un error de validación y no un 500. */
export async function leerJson(peticion: Request): Promise<unknown> {
  try {
    return await peticion.json();
  } catch {
    throw new ErrorValidacion("No pudimos leer los datos enviados. Vuelva a intentarlo.");
  }
}
