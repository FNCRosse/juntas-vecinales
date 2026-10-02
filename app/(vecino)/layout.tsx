import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";

// Layout del actor vecino (FRONTEND.md §1): exige sesión y rol; sin sesión, a /entrar.
export default async function Layout({ children }: { children: ReactNode }) {
  await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return (
    <MarcoActor actor="vecino" modoSenior={await modoSeniorAlRenderizar()}>
      {children}
    </MarcoActor>
  );
}
