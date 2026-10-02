import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { marcarRespuestaTelefono, responderVisita } from "@/modulos/identidad/aplicacion/garita";
import { anularVisita } from "@/modulos/identidad/aplicacion/visitas";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Anular una visita: sale de la lista de la garita al instante (HU-GAR-05). La de otra casa, 404. */
export const DELETE = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await anularVisita(sesion, (await params).id));
});

const respuesta = z.object({ autoriza: z.boolean(), via: z.enum(["app", "telefono"]) });

/**
 * Responder a una visita no anunciada (HU-GAR-07 CA3): la casa desde la app, o el vigilante cuando
 * le respondieron por teléfono. Una visita de otra casa, 404.
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { autoriza, via } = respuesta.parse(await leerJson(peticion));
  const { id } = await params;
  if (via === "telefono") await marcarRespuestaTelefono(sesion, id, autoriza);
  else await responderVisita(sesion, id, autoriza);
  return new Response(null, { status: 204 });
});
