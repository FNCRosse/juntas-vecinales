import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { historialPublico } from "@/modulos/transparencia/aplicacion/historial";

/** El historial público de actas y balances, del más nuevo al más antiguo (HU-ASA-12). */
export const GET = manejar(async (peticion) =>
  Response.json(await historialPublico(await exigirSesion(peticion))),
);
