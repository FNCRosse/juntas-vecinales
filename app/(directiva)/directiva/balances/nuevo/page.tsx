import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { PublicarBalance } from "./PublicarBalance";

export const metadata: Metadata = { title: "Balance de una actividad" };

// DIR-ASA-12 y DIR-ASA-13 (HU-ASA-10): registrar ingresos y gastos con sus comprobantes, ver el
// gráfico y publicar el balance, en dos pasos.
export default async function NuevoBalance() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <PublicarBalance />;
}
