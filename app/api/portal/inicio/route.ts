import { manejar } from "@/compartido/manejar";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Datos del panel de inicio (HU-GAR-19, Anexo I). Hoy, el bloque de M1; cada módulo suma el suyo. */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  return Response.json({ identidad: await bloqueDeIdentidad(sesion) });
});
