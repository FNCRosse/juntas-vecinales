import type { Metadata } from "next";
import { nombreDePantalla } from "@/app/_ayuda/pantallas";
import { exigirActor } from "@/app/_sesion/sesion";
import { MODOS_APOYO } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { quienPideAyuda } from "@/modulos/identidad/aplicacion/datosParaAyuda";
import { PedirAyuda } from "./PedirAyuda";

export const metadata: Metadata = { title: "Pedir ayuda" };

// VEC-AYU-01 y VEC-AYU-02 (HU-ACC-04): ya sabemos quién pide y dónde estaba; no hay que explicarlo.
export default async function Ayuda({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { quien, telefonoTerminadoEn } = await quienPideAyuda(sesion);
  return (
    <PedirAyuda
      quien={quien}
      telefonoTerminadoEn={telefonoTerminadoEn}
      pantalla={nombreDePantalla((await searchParams).desde)}
      modos={Object.entries(MODOS_APOYO).map(([modo, { opcion }]) => ({ modo, opcion }))}
    />
  );
}
