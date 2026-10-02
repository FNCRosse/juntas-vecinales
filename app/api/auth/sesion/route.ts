import { manejar } from "@/compartido/manejar";
import { cerrarSesion } from "@/modulos/identidad/aplicacion/cerrarSesion";
import { COOKIE_SESION, leerCookie } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE } from "@/app/_sesion/sesion";

/** Cerrar sesión en este dispositivo. */
export const DELETE = manejar(async (peticion) => {
  await cerrarSesion(leerCookie(peticion, COOKIE_SESION));
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": `${COOKIE_SESION}=; Max-Age=0; ${ATRIBUTOS_COOKIE}` },
  });
});
