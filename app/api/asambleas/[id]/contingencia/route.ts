import { z } from "zod";
import { desdeHoraDeLima } from "@/compartido/fechas";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { registrarContingencia } from "@/modulos/asambleas/aplicacion/contingencia";

const esquema = z.object({
  decision: z.enum(["REPROGRAMAR", "INFORMATIVA"], {
    error: "Elija si reprograma la asamblea o la convierte en una sesión informativa.",
  }),
  fecha: z.string().optional(),
  hora: z.string().optional(),
});

/** La directiva decide qué hacer sin quórum: reprogramar o sesión informativa (HU-ASA-05). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { decision, fecha, hora } = esquema.parse(await leerJson(peticion));
  const nuevaFechaHora = fecha && hora ? desdeHoraDeLima(fecha, hora) : null;
  const { asamblea } = await registrarContingencia(sesion, (await params).id, { decision, nuevaFechaHora });
  return Response.json(asamblea);
});
