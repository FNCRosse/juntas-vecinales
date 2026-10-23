import { manejar } from "@/compartido/manejar";
import { entregarReciboEnPapel } from "@/modulos/aportes/aplicacion/recibos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Marca como entregado un recibo en papel (HU-COB-12), solo la directiva. `aplicado` dice si esta llamada fue la que lo marcó. */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await entregarReciboEnPapel(sesion, (await params).id));
});
