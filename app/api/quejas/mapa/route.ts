import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { mapaDeIncidentes } from "@/modulos/incidencias/aplicacion/mapa";

/** El mapa de incidentes del barrio, por manzana, con su equivalente en texto (HU-QUE-08, HU-ACC-07). */
export const GET = manejar(async (peticion) =>
  Response.json(await mapaDeIncidentes(await exigirSesion(peticion))),
);
