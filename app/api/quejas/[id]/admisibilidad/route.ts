import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { evaluarAdmisibilidad } from "@/modulos/incidencias/aplicacion/gestion";

const esquema = z.discriminatedUnion(
  "decision",
  [
    z.object({ decision: z.literal("admitir"), prioridad: z.string().nullish() }),
    z.object({ decision: z.literal("rechazar"), motivo: z.string().nullish() }),
  ],
  { error: "Elija qué decide." },
);

/** Calificar la admisibilidad de un reporte (HU-QUE-05). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) =>
  Response.json(
    await evaluarAdmisibilidad(
      await exigirSesion(peticion),
      (await params).id,
      esquema.parse(await leerJson(peticion)),
    ),
  ),
);
