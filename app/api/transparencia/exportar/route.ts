import { manejar } from "@/compartido/manejar";
import { exportarRecaudacion } from "@/modulos/transparencia/aplicacion/exportarRecaudacion";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * Descarga la recaudación en CSV (HU-COB-15), solo para la directiva: el rango de fechas (`desde` y `hasta`, «AAAA-MM-DD»; sin
 * ellos, el mes en curso) y el `estado` de las casas (TODAS, AL_DIA, ATRASO o CRITICO). Cada descarga queda en el historial de
 * acciones. Nunca se guarda en caché.
 */
export const GET = manejar(async (peticion) => {
  const p = new URL(peticion.url).searchParams;
  const { contenido, nombre } = await exportarRecaudacion(await exigirSesion(peticion), {
    desde: p.get("desde") ?? undefined,
    hasta: p.get("hasta") ?? undefined,
    estado: p.get("estado") ?? undefined,
  });
  return new Response(contenido, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nombre}"`,
      "cache-control": "private, no-store",
    },
  });
});
