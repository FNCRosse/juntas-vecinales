import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { CAMPOS } from "@/modulos/identidad/aplicacion/arco";
import { CorregirDato } from "./CorregirDato";

export const metadata: Metadata = { title: "Corregir un dato" };

// VEC-ACC-14 Corregir un dato (HU-GAR-13 CA1 y CA2). El cambio de número de WhatsApp llega con HU-GAR-17.
export default async function Corregir() {
  await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return <CorregirDato campos={CAMPOS} />;
}
