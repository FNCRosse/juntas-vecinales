import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { lugaresParaAsistir } from "@/modulos/incidencias/aplicacion/quejas";
import { RegistrarPorVecino } from "./RegistrarPorVecino";

export const metadata: Metadata = { title: "Registrar un reporte por un vecino" };

// DIR-QUE-08 a DIR-QUE-10 (HU-QUE-03): solo el directivo mediador.
export default async function ReporteAsistido() {
  const sesion = await exigirActor(["DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return <RegistrarPorVecino manzanas={await lugaresParaAsistir(sesion)} />;
}
