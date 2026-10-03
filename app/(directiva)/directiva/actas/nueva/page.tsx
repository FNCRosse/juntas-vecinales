import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { PublicarActa } from "./PublicarActa";

export const metadata: Metadata = { title: "Acta de la asamblea" };

// DIR-ASA-10 y DIR-ASA-11 (HU-ASA-11): redactar el acta, ver el PDF y publicarla, en dos pasos.
export default async function NuevaActa() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <PublicarActa />;
}
