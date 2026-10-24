import { manejar } from "@/compartido/manejar";
import { consultarTablero } from "@/modulos/aportes/aplicacion/tablero";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * El tablero de recaudación (HU-COB-13), solo para la directiva: lo cobrado en un rango de fechas (`desde` y `hasta`,
 * «AAAA-MM-DD»; sin ellos, el mes en curso) y el `estado` de las casas (TODAS, AL_DIA, ATRASO o CRITICO). Nunca se guarda en
 * caché: son las cuentas de la junta.
 */
export const GET = manejar(async (peticion) => {
  const p = new URL(peticion.url).searchParams;
  const tablero = await consultarTablero(await exigirSesion(peticion), {
    desde: p.get("desde") ?? undefined,
    hasta: p.get("hasta") ?? undefined,
    estado: p.get("estado") ?? undefined,
  });
  return Response.json(tablero, { headers: { "cache-control": "private, no-store" } });
});
