import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { tarifaDelPadron } from "@/modulos/aportes/aplicacion/cuotaDelPadron";
import { AsistenteEmpadronar } from "./_componentes/AsistenteEmpadronar";

export const metadata: Metadata = { title: "Empadronar una vivienda" };

// ADM-PAD-03 a ADM-PAD-07 (HU-GAR-01): vivienda, residentes, confirmación y resultado. Las cantidades siguen la lista de la tarifa.
export default async function Empadronar() {
  await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const tarifa = await tarifaDelPadron();
  return <AsistenteEmpadronar conceptos={tarifa.conceptos} desde={tarifa.desde} />;
}
