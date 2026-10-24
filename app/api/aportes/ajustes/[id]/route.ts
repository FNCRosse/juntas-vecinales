import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { decidirReclamo } from "@/modulos/aportes/aplicacion/decidirReclamos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ decision: z.string(), motivo: z.string().optional() });

/**
 * Responde un reclamo de cuota (HU-COB-04), solo la directiva: aprueba el ajuste de un concepto («APROBAR:inquilino») o
 * mantiene la cuota con su motivo («MANTENER»). Repetirlo no cambia nada otra vez: `aplicado` dice si esta llamada fue la
 * que respondió.
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(
    await decidirReclamo(sesion, (await params).id, esquema.parse(await leerJson(peticion))),
  );
});
