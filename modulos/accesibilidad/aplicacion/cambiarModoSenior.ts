// @HU-ACC-01
import { guardarPerfil } from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";
import { aDto, cargarPerfil, type DuenoPerfil } from "./perfilDto";

/** Activa o desactiva "Letra grande" y lo guarda; crea el perfil la primera vez. */
export async function cambiarModoSenior(dueno: DuenoPerfil, activo: boolean) {
  const perfil = await cargarPerfil(dueno);
  if (activo) perfil.activarModoSenior();
  else perfil.desactivarModoSenior();
  return aDto(await guardarPerfil(perfil));
}
