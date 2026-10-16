import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { marcarAvisosNoLeidos } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ ids: z.array(z.string()).min(1).max(100) });

/** Deshacer "marcar como leído" (HU-ACC-03 CA4, R-12). Solo cambia los avisos de quien pregunta (AC-7). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  await marcarAvisosNoLeidos(sesion, esquema.parse(await leerJson(peticion)).ids);
  return new Response(null, { status: 204 });
});
