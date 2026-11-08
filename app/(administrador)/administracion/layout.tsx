import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { RenovarSesion } from "@/app/_sesion/RenovarSesion";

// Layout del actor administrador (FRONTEND.md §1): exige sesión y rol; sin sesión, a /entrar/equipo.
export default async function Layout({ children }: { children: ReactNode }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  return (
    <MarcoActor
      actor="administrador"
      modoSenior={await modoSeniorAlRenderizar()}
      selector={<CambiarDePerfil sesion={sesion} actual="administracion" estilo="boton" />}
    >
      <RenovarSesion />
      {children}
    </MarcoActor>
  );
}
