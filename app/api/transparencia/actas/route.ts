import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { esquemaActa } from "./esquema";
import { actasPublicadas, publicarActa } from "@/modulos/transparencia/aplicacion/actas";

/** Publicar el acta de una asamblea (HU-ASA-11): 201 al publicarla; 200 si ya estaba publicada (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const datos = esquemaActa.extend({ idOperacion: z.uuid() }).parse(await leerJson(peticion));
  const { acta, creado } = await publicarActa(sesion, datos);
  return Response.json(acta, { status: creado ? 201 : 200 });
});

/** Las actas publicadas, las más nuevas primero. */
export const GET = manejar(async (peticion) =>
  Response.json(await actasPublicadas(await exigirSesion(peticion))),
);
