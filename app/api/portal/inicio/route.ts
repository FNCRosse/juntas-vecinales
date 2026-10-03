import { manejar } from "@/compartido/manejar";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { bloqueDeReportes } from "@/modulos/incidencias/aplicacion/quejas";

/** Datos del panel de inicio (HU-GAR-19, Anexo I): el bloque de M1 y el de reportes de M3; M4 y M5 suman el suyo. */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const [identidad, reportes] = await Promise.all([bloqueDeIdentidad(sesion), bloqueDeReportes(sesion)]);
  return Response.json({ identidad, reportes });
});
