import { manejar } from "@/compartido/manejar";
import { cerrarSesion } from "@/modulos/identidad/aplicacion/cerrarSesion";
import { COOKIE_SESION, exigirSesion, leerCookie } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

/** Cerrar sesión en este dispositivo. */
export const DELETE = manejar(async (peticion) => {
  await cerrarSesion(leerCookie(peticion, COOKIE_SESION));
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": `${COOKIE_SESION}=; Max-Age=0; ${ATRIBUTOS_COOKIE}` },
  });
});

/**
 * Renueva la cookie de una sesión vigente (HU-GAR-03 CA2): el navegador la guarda 400 días como
 * máximo, así que se vuelve a poner mientras se usa. Solo termina si la persona sale o la revocan.
 */
export const PUT = manejar(async (peticion) => {
  await exigirSesion(peticion);
  const token = leerCookie(peticion, COOKIE_SESION);
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": `${COOKIE_SESION}=${token}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}` },
  });
});
