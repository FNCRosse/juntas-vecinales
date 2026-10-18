import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { NuevaActividad } from "./NuevaActividad";

export const metadata: Metadata = { title: "Nueva actividad pro-fondos" };

// DIR-ASA-17 y DIR-ASA-18 (HU-ASA-08): publicar una actividad pro fondos en dos pasos.
export default async function NuevaActividadPagina() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <NuevaActividad />;
}
