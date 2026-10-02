import { hashDeToken } from "@/compartido/claves";
import { revocarSesion } from "@/modulos/identidad/infraestructura/repositorioSesiones";

/** Cierra la sesión de este dispositivo. */
export async function cerrarSesion(token: string | undefined, ahora = new Date()) {
  if (token) await revocarSesion(hashDeToken(token), ahora);
}
