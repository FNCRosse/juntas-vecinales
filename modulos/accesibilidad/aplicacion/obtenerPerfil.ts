// @HU-ACC-01
import { cargarPerfil, aDto, type PerfilAccesibilidadDto } from "./perfilDto";

/**
 * Perfil con el que se renderiza la página (ADR-004). Sin perfil guardado, el de por defecto (Normal).
 * Hasta M1 se identifica por la cookie del dispositivo; M1 lo buscará por el usuario de la sesión.
 */
export async function obtenerPerfil(perfilId: string | undefined): Promise<PerfilAccesibilidadDto> {
  return aDto(await cargarPerfil(perfilId));
}
