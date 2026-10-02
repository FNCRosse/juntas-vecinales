import { manejar } from "@/compartido/manejar";
import { consultar } from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Consultar placa, DNI o nombre con el semáforo de la garita (HU-GAR-06). */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const texto = new URL(peticion.url).searchParams.get("texto") ?? "";
  return Response.json(await consultar(sesion, texto));
});
