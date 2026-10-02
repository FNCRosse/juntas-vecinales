// @HU-ACC-01
import {
  asignarPerfilSinDueno,
  buscarPerfilPorUsuario,
} from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";

/**
 * Al entrar: si la cuenta no tiene perfil, se queda con el que la persona eligió en este dispositivo
 * antes de entrar. Si ya tiene uno, manda el de la cuenta (el mismo en todos sus dispositivos, R-10).
 */
export async function pasarPerfilALaCuenta(usuarioId: string, perfilDispositivo: string | undefined) {
  if (!perfilDispositivo || (await buscarPerfilPorUsuario(usuarioId))) return;
  await asignarPerfilSinDueno(perfilDispositivo, usuarioId);
}
