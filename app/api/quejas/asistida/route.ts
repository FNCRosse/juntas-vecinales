import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { registrarQuejaAsistida } from "@/modulos/incidencias/aplicacion/quejas";

const esquema = z.object({
  vecinoId: z.string({ error: "Elija al vecino que reporta." }).min(1, "Elija al vecino que reporta."),
  categoria: z.string().nullish(),
  descripcion: z.string({ error: "Escriba lo que cuenta el vecino." }),
  manzana: z.string().nullable(),
  referencia: z.string().nullish(),
  evidencias: z.array(z.string()).max(10).default([]),
  consentimiento: z.boolean(),
  esAnonimo: z.boolean().optional(),
  idOperacion: z.uuid(),
});

/** El mediador registra un reporte por un vecino (HU-QUE-03): 201 con la constancia; 200 si ya estaba (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { queja, creada } = await registrarQuejaAsistida(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(queja, { status: creada ? 201 : 200 });
});
