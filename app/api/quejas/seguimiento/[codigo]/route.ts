import { manejar } from "@/compartido/manejar";
import { consultarPorCodigo } from "@/modulos/incidencias/aplicacion/seguimiento";

/** La conexión que consulta: la primera IP de x-forwarded-for (Vercel la pone). */
const ipDe = (peticion: Request) =>
  peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";

/** El avance de un reporte por su código, sin sesión y con límite de intentos (HU-QUE-09). */
export const GET = manejar<{ params: Promise<{ codigo: string }> }>(async (peticion, { params }) =>
  Response.json(await consultarPorCodigo(decodeURIComponent((await params).codigo), ipDe(peticion))),
);
