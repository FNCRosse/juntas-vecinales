import { manejar } from "@/compartido/manejar";
import { anularVisita } from "@/modulos/identidad/aplicacion/visitas";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Anular una visita: sale de la lista de la garita al instante (HU-GAR-05). La de otra casa, 404. */
export const DELETE = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await anularVisita(sesion, (await params).id));
});
