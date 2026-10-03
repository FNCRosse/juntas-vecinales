import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { publicarComunicado, verNoticias } from "@/modulos/transparencia/aplicacion/comunicados";

const esquema = z.object({
  titulo: z.string(),
  cuerpo: z.string(),
  urgencia: z.enum(["INFORMATIVO", "URGENTE"], { error: "Elija si el comunicado es informativo o urgente." }),
  idOperacion: z.uuid(),
});

/** Publicar un comunicado general (HU-ASA-15): 201 al publicarlo; 200 si ya estaba publicado (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { comunicado, creado } = await publicarComunicado(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(comunicado, { status: creado ? 201 : 200 });
});

/** El feed comunitario (HU-ASA-15 CA2 y CA3). */
export const GET = manejar(async (peticion) =>
  Response.json(await verNoticias(await exigirSesion(peticion))),
);
