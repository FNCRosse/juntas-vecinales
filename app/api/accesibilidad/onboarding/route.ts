import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { ACCIONES_GUIA, guiasDeUso, registrarAccionDeGuia } from "@/modulos/accesibilidad/aplicacion/guias";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  seccion: z.string(),
  accion: z.enum(ACCIONES_GUIA, { error: "No sabemos qué hacer con la guía." }),
  paso: z.number().int().optional(),
});

/** Las guías de uso con su estado (HU-ACC-10 CA2). */
export const GET = manejar(async (peticion) =>
  Response.json(await guiasDeUso((await exigirSesion(peticion)).usuarioId)),
);

/** Avanzar, pausar, omitir, completar o volver a activar una guía (HU-ACC-10 CA2, CA3). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { seccion, accion, paso } = esquema.parse(await leerJson(peticion));
  return Response.json(await registrarAccionDeGuia(sesion.usuarioId, seccion, accion, paso));
});
