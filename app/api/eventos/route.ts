import { z } from "zod";
import { desdeHoraDeLima } from "@/compartido/fechas";
import { aCentimos } from "@/compartido/dinero";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { publicarActividad, verActividades } from "@/modulos/asambleas/aplicacion/actividades";

const esquema = z.object({
  tipoActividad: z.enum(["POLLADA", "PARRILLADA", "BINGO", "RIFA", "OTRA"], {
    error: "Elija qué actividad es.",
  }),
  nombre: z.string(),
  paraQue: z.string(),
  fecha: z.string(),
  hora: z.string(),
  lugar: z.string(),
  precio: z.string(),
  meta: z.string().default(""),
  pagos: z.enum(["AMBOS", "ANTICIPADO", "PUERTA"], { error: "Elija cómo pueden pagar los vecinos." }),
  pideVoluntarios: z.boolean().default(false),
  idOperacion: z.uuid(),
});

/** Publicar una actividad pro fondos (HU-ASA-08): 201 al publicarla; 200 si ya estaba publicada (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { fecha, hora, precio, meta, ...resto } = esquema.parse(await leerJson(peticion));
  const { actividad, creada } = await publicarActividad(sesion, {
    ...resto,
    fechaHora: desdeHoraDeLima(fecha, hora),
    precioUnidad: aCentimos(precio),
    metaRecaudacion: meta.trim() ? aCentimos(meta) : null,
  });
  return Response.json(actividad, { status: creada ? 201 : 200 });
});

/** Las actividades pro fondos (VEC-ASA-13). */
export const GET = manejar(async (peticion) =>
  Response.json(await verActividades(await exigirSesion(peticion))),
);
