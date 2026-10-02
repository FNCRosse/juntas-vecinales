import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { quitarAcceso } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  motivo: z.enum(["CARGO", "CONTRATO", "OTRO"], { error: "Elija por qué se le quita el acceso." }),
});

/** Quitar el acceso de equipo y cerrar sus sesiones (HU-GAR-22). */
export const DELETE = manejar<{ params: Promise<{ usuarioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { motivo } = esquema.parse(await leerJson(peticion));
  return Response.json(await quitarAcceso(sesion, (await params).usuarioId, motivo));
});
