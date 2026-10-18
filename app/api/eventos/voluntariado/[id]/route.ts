import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { evaluarVoluntariado } from "@/modulos/asambleas/aplicacion/voluntarios";

const esquema = z.object({
  decision: z.enum(["APROBAR", "NO_APROBAR"], { error: "Elija si aprueba la ayuda o no." }),
  rol: z.string().default(""),
});

/** La directiva aprueba la ayuda registrando el rol asignado, o no la aprueba por ahora (HU-ASA-09 CA2). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { voluntariado } = await evaluarVoluntariado(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json(voluntariado);
});
