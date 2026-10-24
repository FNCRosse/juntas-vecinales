import { manejar } from "@/compartido/manejar";
import { cancelarPedidoDeCobro } from "@/modulos/aportes/aplicacion/cobros";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La casa cancela su pedido de cobro en casa (HU-COB-11). 404 si es de otra casa (AC-7); `aplicado` dice si esta llamada fue la que lo canceló. */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await cancelarPedidoDeCobro(sesion, (await params).id));
});
