import { manejar } from "@/compartido/manejar";
import { generarEnlaceDeInvitacion } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Generar un enlace de invitación nuevo para copiarlo, sin pasar por WhatsApp (HU-GAR-21 CA2). */
export const POST = manejar<{ params: Promise<{ usuarioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  const generado = await generarEnlaceDeInvitacion(sesion, (await params).usuarioId, origen);
  return Response.json(generado, { status: 201, headers: { "cache-control": "no-store" } });
});
