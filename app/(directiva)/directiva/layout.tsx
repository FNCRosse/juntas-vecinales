import type { ReactNode } from "react";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { RenovarSesion } from "@/app/_sesion/RenovarSesion";
import { bandejaDeCobros } from "@/modulos/aportes/aplicacion/inicio";
import { quejasPorAtender } from "@/modulos/incidencias/aplicacion/quejas";
import { SincronizarCobros } from "./cobros/SincronizarCobros";

// Layout del actor directiva (FRONTEND.md §1): exige sesión y rol; sin sesión, a /entrar/equipo. La barra muestra
// cuántos cobros e incidentes esperan, como en el prototipo.
export default async function Layout({ children }: { children: ReactNode }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const [cobros, quejas, modoSenior] = await Promise.all([
    bandejaDeCobros(sesion),
    quejasPorAtender(sesion),
    modoSeniorAlRenderizar(),
  ]);
  return (
    <MarcoActor
      actor="directiva"
      modoSenior={modoSenior}
      selector={<CambiarDePerfil sesion={sesion} actual="directiva" estilo="boton" />}
      conteos={{ "/directiva/cobros": cobros.total, "/directiva/incidentes": quejas.porEvaluar }}
    >
      <RenovarSesion />
      <SincronizarCobros />
      {children}
    </MarcoActor>
  );
}
