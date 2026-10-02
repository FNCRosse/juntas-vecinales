import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { aceptarPolitica, MENSAJE_FALTA_ACEPTAR } from "@/modulos/identidad/aplicacion/primerIngreso";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ acepto: z.literal(true, { error: MENSAJE_FALTA_ACEPTAR }) });

/** Aceptación expresa de la política de privacidad (HU-GAR-02 CA2). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  esquema.parse(await leerJson(peticion));
  return Response.json(await aceptarPolitica(sesion));
});
