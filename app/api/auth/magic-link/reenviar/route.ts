import { after } from "next/server";
import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { despertarWorker } from "@/compartido/notificaciones/despertar";
import { pedirEnlace } from "@/modulos/identidad/aplicacion/entradaAlterna";

const esquema = z.object({ identificador: z.string().max(40) });

/** Pedir un enlace nuevo de entrada con el DNI o la casa (HU-GAR-11). */
export const POST = manejar(async (peticion) => {
  const { identificador } = esquema.parse(await leerJson(peticion));
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  await pedirEnlace(identificador, "ENTRADA", origen);
  after(despertarWorker);
  // Siempre la misma respuesta: no dice si el DNI o la casa están en el padrón.
  return new Response(null, { status: 202 });
});
