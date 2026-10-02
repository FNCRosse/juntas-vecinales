import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { crearClaveRespaldo } from "@/modulos/identidad/aplicacion/primerIngreso";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ clave: z.string().max(200, "La clave es demasiado larga. Use una más corta.") });

/** Clave de respaldo opcional (HU-GAR-02 CA3). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { clave } = esquema.parse(await leerJson(peticion));
  return Response.json(await crearClaveRespaldo(sesion, clave), { status: 201 });
});
