import { z } from "zod";
import { desdeHoraDeLima } from "@/compartido/fechas";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { publicarConvocatoria, verAsambleas } from "@/modulos/asambleas/aplicacion/convocatorias";

const esquema = z.object({
  tipoAsamblea: z.enum(["ORDINARIA", "EXTRAORDINARIA"], {
    error: "Elija si la asamblea es ordinaria o extraordinaria.",
  }),
  fecha: z.string(),
  hora: z.string(),
  lugar: z.string(),
  motivo: z.string(),
  idOperacion: z.uuid(),
});

/** Publicar una convocatoria a asamblea (HU-ASA-01): 201 al publicarla; 200 si ya estaba publicada (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { fecha, hora, ...resto } = esquema.parse(await leerJson(peticion));
  const { asamblea, creada } = await publicarConvocatoria(sesion, {
    ...resto,
    fechaHora: desdeHoraDeLima(fecha, hora),
  });
  return Response.json(asamblea, { status: creada ? 201 : 200 });
});

/** Las asambleas convocadas (DIR-ASA-01 y VEC-ASA-01). */
export const GET = manejar(async (peticion) =>
  Response.json(await verAsambleas(await exigirSesion(peticion))),
);
