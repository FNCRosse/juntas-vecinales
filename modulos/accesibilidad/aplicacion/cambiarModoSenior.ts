// @HU-ACC-01
import { guardarPerfil } from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";
import { aDto, cargarPerfil } from "./perfilDto";

/** Activa o desactiva "Letra grande" y lo guarda; crea el perfil la primera vez. */
export async function cambiarModoSenior(perfilId: string | undefined, activo: boolean) {
  const perfil = await cargarPerfil(perfilId);
  if (activo) perfil.activarModoSenior();
  else perfil.desactivarModoSenior();
  return aDto(await guardarPerfil(perfil));
}
