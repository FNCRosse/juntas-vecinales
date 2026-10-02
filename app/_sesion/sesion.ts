import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { COOKIE_SESION, type NombreRol, obtenerSesion } from "@/modulos/identidad/aplicacion/sesion";
import { VIDA_SESION_DIAS } from "@/compartido/retencion";

/** Sesión de la petición, leída una vez por render. */
export const sesionActual = cache(async () => obtenerSesion((await cookies()).get(COOKIE_SESION)?.value));

/** A dónde va cada persona al entrar, según su rol principal. */
export function inicioSegunRoles(roles: NombreRol[]) {
  if (roles.includes("ADMINISTRADOR")) return "/administracion";
  if (roles.includes("VIGILANTE")) return "/garita";
  if (roles.includes("DIRECTIVA") || roles.includes("DIRECTIVO_MEDIADOR")) return "/directiva";
  return "/";
}

/**
 * Para los layouts de cada actor: sin sesión, a la entrada que corresponde; con otro rol, a su
 * propio inicio. La autorización de cada acción se repite en aplicacion/.
 */
export async function exigirActor(roles: NombreRol[], entrada: string) {
  const sesion = await sesionActual();
  if (!sesion) redirect(entrada);
  if (!sesion.roles.some((rol) => roles.includes(rol))) redirect(inicioSegunRoles(sesion.roles));
  return sesion;
}

export const ATRIBUTOS_COOKIE = "Path=/; HttpOnly; Secure; SameSite=Lax";
export const UN_ANIO_SEGUNDOS = VIDA_SESION_DIAS * 24 * 60 * 60;
