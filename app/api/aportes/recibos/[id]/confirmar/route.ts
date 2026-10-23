import { manejar } from "@/compartido/manejar";
import { confirmarRecibo } from "@/modulos/aportes/aplicacion/recibos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La casa confirma que recibió su recibo (HU-COB-12). Solo de un recibo suyo ya enviado: 404 si es de otra casa (AC-7). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await confirmarRecibo(sesion, (await params).id));
});
