import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { RenovarSesion } from "@/app/_sesion/RenovarSesion";

// Layout del actor garita (FRONTEND.md §1): exige sesión y rol; sin sesión, a /entrar/equipo.
export default async function Layout({ children }: { children: ReactNode }) {
  await exigirActor(["VIGILANTE"], "/entrar/equipo");
  return (
    <MarcoActor actor="garita" modoSenior={await modoSeniorAlRenderizar()}>
      <RenovarSesion />
      {children}
    </MarcoActor>
  );
}
