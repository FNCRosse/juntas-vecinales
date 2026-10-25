import { manejar } from "@/compartido/manejar";
import { bloqueDeCuota } from "@/modulos/aportes/aplicacion/inicio";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { bloqueDeReportes } from "@/modulos/incidencias/aplicacion/quejas";

/** Datos del panel de inicio (HU-GAR-19, Anexo I): el bloque de M1 y el de reportes de M3 y el de la cuota de M5. */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const [identidad, reportes, cuota] = await Promise.all([
    bloqueDeIdentidad(sesion),
    bloqueDeReportes(sesion),
    bloqueDeCuota(sesion),
  ]);
  return Response.json({ identidad, reportes, cuota });
});
