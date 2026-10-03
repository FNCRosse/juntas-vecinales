import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { oficioParaDirectiva } from "@/modulos/incidencias/aplicacion/derivacion";
import { miOficio } from "@/modulos/incidencias/aplicacion/seguimiento";
import { respuestaPdf } from "../../pdf";

/**
 * El oficio en PDF (HU-QUE-07): la directiva ve el definitivo o la vista previa (`?entidad=PNP`); quien
 * reportó, el de su reporte derivado. Cualquier otra persona recibe 404 (AC-7).
 */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { id } = await params;
  const esDirectiva = sesion.roles.some((r) => r === "DIRECTIVA" || r === "DIRECTIVO_MEDIADOR");
  return respuestaPdf(
    esDirectiva
      ? await oficioParaDirectiva(sesion, id, new URL(peticion.url).searchParams.get("entidad"))
      : await miOficio(sesion, id),
  );
});
