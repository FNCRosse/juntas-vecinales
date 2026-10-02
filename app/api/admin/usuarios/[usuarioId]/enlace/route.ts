import { after } from "next/server";
import { manejar } from "@/compartido/manejar";
import { despertarWorker } from "@/compartido/notificaciones/despertar";
import { reenviarEnlace } from "@/modulos/identidad/aplicacion/reenviarEnlace";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La administración reenvía el enlace de entrada de un residente (ADM-PAD-02, HU-GAR-11). */
export const POST = manejar<{ params: Promise<{ usuarioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  const enviado = await reenviarEnlace(sesion, (await params).usuarioId, origen);
  after(despertarWorker);
  return Response.json(enviado);
});
