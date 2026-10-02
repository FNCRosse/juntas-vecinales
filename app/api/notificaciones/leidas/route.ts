import { manejar } from "@/compartido/manejar";
import { marcarTodosLeidos } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Marcar todos los avisos como leídos (HU-GAR-20 CA2). */
export const POST = manejar(async (peticion) => {
  await marcarTodosLeidos(await exigirSesion(peticion));
  return new Response(null, { status: 204 });
});
