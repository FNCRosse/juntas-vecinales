import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { resolverCambioDeNumero } from "@/modulos/identidad/aplicacion/arco";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  aprobar: z.boolean(),
  motivo: z.string().max(500).optional(),
  verificacion: z.enum(["DIRECTIVA", "PERSONA_CON_DNI"]).optional(),
});

/**
 * Aprobar o rechazar el cambio de número, con la verificación de identidad (HU-GAR-17 CA2 y CA3).
 * Ruta añadida al Anexo I (ARQUITECTURA.md §8).
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const decision = esquema.parse(await leerJson(peticion));
  return Response.json(await resolverCambioDeNumero(sesion, (await params).id, decision));
});
