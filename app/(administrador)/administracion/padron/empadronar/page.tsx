import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { AsistenteEmpadronar } from "./_componentes/AsistenteEmpadronar";

export const metadata: Metadata = { title: "Empadronar una vivienda" };

// ADM-PAD-03 a ADM-PAD-07 (HU-GAR-01): vivienda, residentes, confirmación y resultado.
export default async function Empadronar() {
  await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  return <AsistenteEmpadronar />;
}
