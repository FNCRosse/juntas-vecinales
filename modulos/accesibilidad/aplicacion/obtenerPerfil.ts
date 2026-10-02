// @HU-ACC-01
import { aDto, cargarPerfil, type DuenoPerfil, type PerfilAccesibilidadDto } from "./perfilDto";

/**
 * Perfil con el que se renderiza la página (ADR-004): el de la cuenta si hay sesión, así se conserva
 * desde otro dispositivo (CA1, R-10); si no, el del dispositivo. Sin perfil guardado, el de por defecto.
 */
export async function obtenerPerfil(dueno: DuenoPerfil): Promise<PerfilAccesibilidadDto> {
  return aDto(await cargarPerfil(dueno));
}
