import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { registrarReclamo } from "@/modulos/aportes/aplicacion/reclamos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  motivo: z.string(),
  detalle: z.string().optional(),
  archivoId: z.string().optional(),
  idOperacion: z.uuid(),
});

/**
 * La casa reclama el monto de su cuota (HU-COB-03): 201 al enviarlo; 200 con el mismo reclamo si ese `idOperacion` ya
 * estaba (AC-5). Responde 422 si ya tiene un reclamo en revisión.
 */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { reclamo, creado } = await registrarReclamo(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(reclamo, { status: creado ? 201 : 200 });
});
