import { after } from "next/server";
import { leerJson, manejar } from "@/compartido/manejar";
import { despertarWorker } from "@/compartido/notificaciones/despertar";
import { empadronar } from "@/modulos/identidad/aplicacion/empadronar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { esquemaEmpadronamiento } from "../esquema";

/** Empadrona una vivienda y envía los enlaces de entrada (HU-GAR-01). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const datos = esquemaEmpadronamiento.parse(await leerJson(peticion));
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  const vivienda = await empadronar(sesion, datos, origen);
  // El enlace vence en 15 minutos: no se espera al cron para enviarlo.
  after(despertarWorker);
  return Response.json(vivienda, { status: 201 });
});
