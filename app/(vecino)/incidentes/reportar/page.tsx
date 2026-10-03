import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { lugaresParaReportar } from "@/modulos/incidencias/aplicacion/quejas";
import { ReportarProblema } from "./ReportarProblema";

export const metadata: Metadata = { title: "Reportar un problema" };

// VEC-QUE-04 a VEC-QUE-07 y VEC-QUE-10 (HU-QUE-01, HU-QUE-04).
export default async function Reportar() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { manzanas, miManzana } = await lugaresParaReportar(sesion);
  return <ReportarProblema manzanas={manzanas} miManzana={miManzana} nombre={sesion.nombreCompleto} />;
}
