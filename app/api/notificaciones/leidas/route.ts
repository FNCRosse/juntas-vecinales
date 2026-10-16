import { manejar } from "@/compartido/manejar";
import { marcarTodosLeidos } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Marcar todos los avisos como leídos (HU-GAR-20 CA2); responde cuáles eran, para deshacerlo (HU-ACC-03 CA4). */
export const POST = manejar(async (peticion) =>
  Response.json({ ids: await marcarTodosLeidos(await exigirSesion(peticion)) }),
);
