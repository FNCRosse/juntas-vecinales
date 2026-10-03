import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { misQuejas, registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";

const coordenada = z.number({ error: "No pudimos leer su ubicación." }).nullish();
const esquema = z.object({
  categoria: z.string().nullish(),
  descripcion: z.string({ error: "Falta contar qué pasó." }),
  manzana: z.string().nullable(),
  referencia: z.string().nullish(),
  latitud: coordenada,
  longitud: coordenada,
  evidencias: z.array(z.string()).max(10),
  consentimiento: z.boolean(),
  idOperacion: z.uuid(),
});

/** Registrar una queja (HU-QUE-01, HU-QUE-04): 201 con el ticket; 200 si ya estaba registrada (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { queja, creada } = await registrarQueja(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(queja, { status: creada ? 201 : 200 });
});

/** Los reportes de quien pregunta, los más nuevos arriba. */
export const GET = manejar(async (peticion) => Response.json(await misQuejas(await exigirSesion(peticion))));
