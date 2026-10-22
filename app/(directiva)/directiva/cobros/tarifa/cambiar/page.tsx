import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { verTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import { CambiarTarifa } from "./CambiarTarifa";

export const metadata: Metadata = { title: "Cambiar la tarifa" };

// DIR-COB-22 y DIR-COB-23 (HU-COB-16 CA1 y CA2): cambiar un monto o agregar un concepto, en dos pasos. Solo la directiva.
export default async function CambiarLaTarifa() {
  const sesion = await exigirActor(["DIRECTIVA"], "/entrar/equipo");
  const { conceptos, opciones } = await verTarifa(sesion);
  return <CambiarTarifa conceptos={conceptos} opciones={opciones} />;
}
