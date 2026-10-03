import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { vecinosParaAsistir } from "@/modulos/incidencias/aplicacion/quejas";

/** Buscar al vecino por nombre, DNI o casa, para registrar su reporte (DIR-QUE-08). */
export const GET = manejar(async (peticion) => {
  const texto = new URL(peticion.url).searchParams.get("q") ?? "";
  return Response.json(await vecinosParaAsistir(await exigirSesion(peticion), texto));
});
