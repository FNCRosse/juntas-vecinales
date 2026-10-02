import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { MOTIVOS_CANCELACION } from "@/modulos/identidad/aplicacion/arco";
import { CancelarCuenta } from "./CancelarCuenta";

export const metadata: Metadata = { title: "Cancelar mi cuenta" };

// VEC-ACC-15 Cancelar mi cuenta (HU-GAR-14 CA1): qué pasará, el motivo y la confirmación.
export default async function Cancelar() {
  await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return <CancelarCuenta motivos={MOTIVOS_CANCELACION} />;
}
