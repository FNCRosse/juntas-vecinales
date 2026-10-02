import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarRol } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  rol: z.enum(["DIRECTIVA", "DIRECTIVO_MEDIADOR", "VIGILANTE"], { error: "Elija el rol nuevo." }),
});

/** Cambiar el rol de un miembro del equipo (HU-GAR-23). */
export const PATCH = manejar<{ params: Promise<{ usuarioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { rol } = esquema.parse(await leerJson(peticion));
  return Response.json(await cambiarRol(sesion, (await params).usuarioId, rol));
});
