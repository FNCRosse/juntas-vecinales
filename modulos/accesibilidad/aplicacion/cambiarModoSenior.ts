// @HU-ACC-01
import type { Transaccion } from "@/compartido/bd/cliente";
import { PerfilAccesibilidad } from "@/modulos/accesibilidad/dominio/perfilAccesibilidad";
import { crearPerfilEn, guardarPerfil } from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";
import { aDto, cargarPerfil, type DuenoPerfil } from "./perfilDto";

/**
 * La administración deja la vista grande activada al empadronar a una persona (HU-ACC-01 CA4): su
 * cuenta nace con ese perfil y su primera entrada ya se ve grande. Es una decisión tomada con la
 * persona, no una consecuencia de su edad (ADR-004).
 */
export async function activarVistaGrandeAlEmpadronar(tx: Transaccion, usuarioId: string) {
  const perfil = PerfilAccesibilidad.porDefecto(usuarioId);
  perfil.activarModoSenior();
  await crearPerfilEn(tx, perfil);
}

/** Activa o desactiva "Letra grande" y lo guarda; crea el perfil la primera vez. */
export async function cambiarModoSenior(dueno: DuenoPerfil, activo: boolean) {
  const perfil = await cargarPerfil(dueno);
  if (activo) perfil.activarModoSenior();
  else perfil.desactivarModoSenior();
  return aDto(await guardarPerfil(perfil));
}
