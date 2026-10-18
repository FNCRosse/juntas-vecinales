import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { cambiarDecision, decidirPropuesta } from "@/modulos/asambleas/aplicacion/propuestas";

const esquema = z.object({
  decision: z.enum(["INCLUIR", "NO_INCLUIR", "REABRIR"], {
    error: "Elija si incluye la propuesta en la agenda o no.",
  }),
  motivo: z.string().default(""),
});

/**
 * La directiva decide sobre una propuesta: la incluye en la agenda, no la incluye con un motivo breve o la
 * reabre para cambiar la decisión (HU-ASA-14).
 */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { id } = await params;
  const { decision, motivo } = esquema.parse(await leerJson(peticion));
  const { propuesta } =
    decision === "REABRIR"
      ? await cambiarDecision(sesion, id)
      : await decidirPropuesta(sesion, id, { decision, motivo });
  return Response.json(propuesta);
});
