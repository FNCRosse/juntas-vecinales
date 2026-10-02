import { leerJson, manejar } from "@/compartido/manejar";
import { validarEmpadronamiento } from "@/modulos/identidad/aplicacion/empadronar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { esquemaEmpadronamiento } from "../esquema";

/** Revisa un paso del asistente de empadronamiento sin guardar nada (lote libre, DNI no repetido). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  await validarEmpadronamiento(sesion, esquemaEmpadronamiento.parse(await leerJson(peticion)));
  return new Response(null, { status: 204 });
});
