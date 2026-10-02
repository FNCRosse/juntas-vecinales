import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";

// Layout del actor administrador (FRONTEND.md §1). Pendiente de M1: exigir sesión y rol.
export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <MarcoActor actor="administrador" modoSenior={await modoSeniorAlRenderizar()}>
      {children}
    </MarcoActor>
  );
}
