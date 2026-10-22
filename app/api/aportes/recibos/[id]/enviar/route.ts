import { manejar } from "@/compartido/manejar";
import { enviarReciboALaApp } from "@/modulos/aportes/aplicacion/recibos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Envía el recibo a la app de quien pagó (HU-COB-12), solo la directiva. `aplicado` dice si esta llamada fue la que lo envió. */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await enviarReciboALaApp(sesion, (await params).id));
});
