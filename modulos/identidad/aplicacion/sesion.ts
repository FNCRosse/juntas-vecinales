import { hashDeToken } from "@/compartido/claves";
import { ErrorNoAutenticado, ErrorNoAutorizado } from "@/compartido/errores";
import { buscarSesionVigente, marcarUso } from "@/modulos/identidad/infraestructura/repositorioSesiones";

// Puerto de sesión del módulo identidad: lo usan app/ y los demás módulos (docs/BACKEND.md §5).

export type NombreRol =
  "VECINO" | "VECINO_ADULTO_MAYOR" | "DIRECTIVA" | "DIRECTIVO_MEDIADOR" | "VIGILANTE" | "ADMINISTRADOR";

export type SesionDto = { usuarioId: string; nombreCompleto: string; roles: NombreRol[] };

/** Cookie HttpOnly con el token de sesión; en la BD solo está su hash. */
export const COOKIE_SESION = "sesion";

/** La sesión del vecino es persistente: se renueva al usarla (HU-GAR-03). */
const RENOVAR_CADA_MS = 60 * 60 * 1000;

export async function obtenerSesion(
  token: string | undefined,
  ahora = new Date(),
): Promise<SesionDto | null> {
  if (!token) return null;
  const sesion = await buscarSesionVigente(hashDeToken(token));
  if (!sesion) return null;
  if (ahora.getTime() - sesion.ultimoUsoEn.getTime() > RENOVAR_CADA_MS) await marcarUso(sesion.id, ahora);
  const { id: usuarioId, nombreCompleto, roles } = sesion.usuario;
  return { usuarioId, nombreCompleto, roles };
}

export function leerCookie(peticion: Request, nombre: string) {
  return peticion.headers
    .get("cookie")
    ?.split(";")
    .map((par) => par.trim())
    .find((par) => par.startsWith(`${nombre}=`))
    ?.slice(nombre.length + 1);
}

/** Para los route handlers: la sesión de la petición o 401. */
export async function exigirSesion(peticion: Request) {
  const sesion = await obtenerSesion(leerCookie(peticion, COOKIE_SESION));
  if (!sesion) throw new ErrorNoAutenticado();
  return sesion;
}

/** La autorización real se hace en aplicacion/, con la sesión ya leída. */
export function exigirRol(sesion: SesionDto, ...roles: NombreRol[]) {
  if (!sesion.roles.some((rol) => roles.includes(rol))) throw new ErrorNoAutorizado();
  return sesion;
}
