import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { darDeBajaResidente } from "@/modulos/identidad/aplicacion/gestionarPadron";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  usuarioId: z.string({ error: "Elija a quién dar de baja." }).min(1, "Elija a quién dar de baja."),
  motivo: z.enum(["MUDANZA", "FALLECIMIENTO", "OTRO"], { error: "Elija por qué se le da de baja." }),
});

/** Dar de baja a un residente del predio (HU-GAR-09). */
export const POST = manejar<{ params: Promise<{ predioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { usuarioId, motivo } = esquema.parse(await leerJson(peticion));
  return Response.json(await darDeBajaResidente(sesion, (await params).predioId, usuarioId, motivo));
});
