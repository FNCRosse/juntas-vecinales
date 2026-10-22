import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { observarComprobante } from "@/modulos/aportes/aplicacion/pagos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ motivo: z.string(), nota: z.string().optional() });

/**
 * Marca un comprobante como observado con un motivo (HU-COB-10), solo la directiva: avisa a quien pagó para que mande
 * otra foto. Repetirlo no avisa otra vez: `aplicado` dice si esta llamada fue la que lo observó.
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(
    await observarComprobante(sesion, (await params).id, esquema.parse(await leerJson(peticion))),
  );
});
