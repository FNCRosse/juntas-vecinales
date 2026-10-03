import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { PublicarComunicado } from "./PublicarComunicado";

export const metadata: Metadata = { title: "Comunicado a la comunidad" };

// DIR-ASA-14 y DIR-ASA-15 (HU-ASA-15): redactar y publicar, en dos pasos.
export default async function NuevoComunicado() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <PublicarComunicado />;
}
