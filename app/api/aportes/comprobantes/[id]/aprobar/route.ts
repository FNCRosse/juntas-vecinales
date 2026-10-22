import { manejar } from "@/compartido/manejar";
import { aprobarComprobante } from "@/modulos/aportes/aplicacion/pagos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * Aprueba el pago de un comprobante (HU-COB-09), solo la directiva: aplica el abono, avisa a quien pagó y restituye la
 * garita si ya no hay atraso crítico. Repetirlo no abona otra vez: `aplicado` dice si esta llamada fue la que aprobó.
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await aprobarComprobante(sesion, (await params).id));
});
