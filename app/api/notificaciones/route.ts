import { z } from "zod";
import { manejar } from "@/compartido/manejar";
import { FILTROS, verAvisos } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const filtro = z
  .enum(Object.keys(FILTROS) as [keyof typeof FILTROS, ...(keyof typeof FILTROS)[]])
  .catch("todos");

/** Los avisos de quien pregunta (HU-GAR-20), filtrables por tipo con ?tipo=. */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await verAvisos(sesion, filtro.parse(new URL(peticion.url).searchParams.get("tipo"))));
});
