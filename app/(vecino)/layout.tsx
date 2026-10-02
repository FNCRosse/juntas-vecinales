import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { RenovarSesion } from "@/app/_sesion/RenovarSesion";

// Layout del actor vecino (FRONTEND.md §1): exige sesión, rol y la política aceptada; sin sesión, a /entrar.
export default async function Layout({ children }: { children: ReactNode }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  // Sin aceptar la política vigente, el vecino no sigue (HU-GAR-02 CA2).
  if (!sesion.politicaAceptada) redirect("/entrar/privacidad");
  return (
    <MarcoActor actor="vecino" modoSenior={await modoSeniorAlRenderizar()}>
      <RenovarSesion />
      {children}
    </MarcoActor>
  );
}
