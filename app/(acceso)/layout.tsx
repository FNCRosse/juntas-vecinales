import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";

// Pantallas de acceso, sin sesión: "Letra grande" sí; navegación y "Pedir ayuda", no (FRONTEND.md §1).
export default async function Layout({ children }: { children: ReactNode }) {
  return <MarcoActor modoSenior={await modoSeniorAlRenderizar()}>{children}</MarcoActor>;
}
