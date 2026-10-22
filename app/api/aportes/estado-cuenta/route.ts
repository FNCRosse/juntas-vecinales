import { ErrorNoEncontrado } from "@/compartido/errores";
import { manejar } from "@/compartido/manejar";
import { miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * El estado de cuenta privado de la casa de quien pide (HU-COB-02): semanas pendientes, lo ya pagado y los conceptos de
 * su cuota. La casa sale de la sesión: no hay parámetro para pedir otra (CA2, AC-7). Nunca se guarda en caché (CA3).
 */
export const GET = manejar(async (peticion) => {
  const cuota = await miCuota(await exigirSesion(peticion));
  if (!cuota) throw new ErrorNoEncontrado();
  return Response.json(cuota, { headers: { "cache-control": "private, no-store" } });
});
