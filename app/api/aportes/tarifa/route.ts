import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarTarifa, verTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  concepto: z.string(),
  nombre: z.string().optional(),
  unidad: z.string().optional(),
  monto: z.number().nullable(),
  vigencia: z.string(),
  acta: z.string(),
  idOperacion: z.uuid(),
});

/** La tarifa vigente, lo programado y su historial, para la directiva y el mediador (HU-COB-16 CA1 y CA3). */
export const GET = manejar(async (peticion) => Response.json(await verTarifa(await exigirSesion(peticion))));

/** Programa un cambio de tarifa (solo la directiva): 201; 200 si ya estaba programado (AC-5). */
export const PUT = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { cambio, avisadas, creado } = await cambiarTarifa(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json({ ...cambio, avisadas }, { status: creado ? 201 : 200 });
});
