import { manejar } from "@/compartido/manejar";
import { instantanea } from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La lista guardada de la tablet para consultar sin internet (AC-4, HU-GAR-06). */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await instantanea(sesion), { headers: { "cache-control": "no-store" } });
});
