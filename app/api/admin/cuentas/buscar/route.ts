import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { buscarEnPadron } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "El DNI tiene 8 números. Revise que estén todos."),
});

/** Buscar en el padrón a quien se le dará un rol (ADM-EQU-02); solo la administración. */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { dni } = esquema.parse(await leerJson(peticion));
  return Response.json(await buscarEnPadron(sesion, dni));
});
