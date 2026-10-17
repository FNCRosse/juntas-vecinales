import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { NuevaConvocatoria } from "./NuevaConvocatoria";

export const metadata: Metadata = { title: "Nueva convocatoria" };

// DIR-ASA-02 a DIR-ASA-04 (HU-ASA-01): convocar una asamblea en dos pasos y publicar el afiche.
export default async function NuevaAsamblea() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <NuevaConvocatoria />;
}
