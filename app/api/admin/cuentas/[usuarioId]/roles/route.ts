import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarRolesDeDirectiva } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  roles: z.array(z.enum(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], { error: "Elija un rol de la lista." })),
});

/** Sumar o quitar roles de directiva en una cuenta de administración (HU-GAR-23). */
export const PATCH = manejar<{ params: Promise<{ usuarioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { roles } = esquema.parse(await leerJson(peticion));
  return Response.json(await cambiarRolesDeDirectiva(sesion, (await params).usuarioId, roles));
});
