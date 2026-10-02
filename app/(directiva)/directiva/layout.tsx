import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";

// Layout del actor directiva (FRONTEND.md §1): exige sesión y rol; sin sesión, a /entrar/equipo.
export default async function Layout({ children }: { children: ReactNode }) {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return (
    <MarcoActor actor="directiva" modoSenior={await modoSeniorAlRenderizar()}>
      {children}
    </MarcoActor>
  );
}
