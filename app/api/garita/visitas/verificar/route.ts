import { manejar } from "@/compartido/manejar";
import { verificarVisita } from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Buscar a la visita en la lista blanca de hoy (HU-GAR-07 CA1). */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const texto = new URL(peticion.url).searchParams.get("texto") ?? "";
  return Response.json({ coincidencias: await verificarVisita(sesion, texto) });
});
