// @HU-GAR-19
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { proximaActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { miAsistencia, proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";

/**
 * Lo que el inicio del vecino muestra de M4 sin que tenga que navegar (HU-GAR-19, AC-2): la próxima asamblea y si
 * su casa ya confirmó, y la próxima actividad pro fondos. Se lee en cada carga, así refleja el último cambio.
 */
export async function bloqueDeInicio(sesion: SesionDto, ahora = new Date()) {
  const [asamblea, actividad] = await Promise.all([
    proximaAsamblea(sesion, ahora),
    proximaActividad(sesion, ahora),
  ]);
  return {
    asamblea: asamblea
      ? {
          titulo: asamblea.titulo,
          fechaHora: asamblea.fechaHora,
          lugar: asamblea.lugar,
          estado: asamblea.estado,
          confirmo: await miAsistencia(sesion, asamblea.id),
        }
      : null,
    actividad: actividad
      ? { nombre: actividad.nombre, fechaHora: actividad.fechaHora, lugar: actividad.lugar }
      : null,
  };
}

export type BloqueDeInicio = Awaited<ReturnType<typeof bloqueDeInicio>>;
