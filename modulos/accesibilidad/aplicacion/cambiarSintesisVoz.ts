// @HU-ACC-02
import { guardarPerfil } from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";
import { aDto, cargarPerfil, type DuenoPerfil } from "./perfilDto";

/** Activa o desactiva la lectura en voz alta de las noticias y la guarda en el perfil. */
export async function cambiarSintesisVoz(dueno: DuenoPerfil, activa: boolean) {
  const perfil = await cargarPerfil(dueno);
  if (activa) perfil.activarSintesisVoz();
  else perfil.desactivarSintesisVoz();
  return aDto(await guardarPerfil(perfil));
}
