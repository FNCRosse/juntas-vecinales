import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { cuentasDelBarrio } from "@/modulos/transparencia/aplicacion/cuentasDelBarrio";

/**
 * El balance agregado de la recaudación (HU-COB-14), para todo vecino con sesión: solo totales del barrio del mes (`periodo`,
 * «AAAA-MM»; sin él, el mes en curso). No trae nada de una casa ni de una persona. Nunca se guarda en caché: cambia con cada pago.
 */
export const GET = manejar(async (peticion) => {
  const periodo = new URL(peticion.url).searchParams.get("periodo") ?? undefined;
  return Response.json(await cuentasDelBarrio(await exigirSesion(peticion), periodo), {
    headers: { "cache-control": "private, no-store" },
  });
});
