import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { misPreferencias } from "@/modulos/identidad/aplicacion/avisos";
import { Preferencias } from "./Preferencias";

export const metadata: Metadata = { title: "Qué avisos recibo" };

// VEC-ACC-12 Qué avisos recibo (HU-GAR-18).
export default async function PreferenciasPagina() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return <Preferencias iniciales={await misPreferencias(sesion)} />;
}
