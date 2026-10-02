import type { Metadata } from "next";
import { AyudaEquipo } from "@/app/_ayuda/AyudaEquipo";
import { exigirActor } from "@/app/_sesion/sesion";

export const metadata: Metadata = { title: "Pedir ayuda" };

export default async function Ayuda() {
  await exigirActor(["VIGILANTE"], "/entrar/equipo");
  return <AyudaEquipo />;
}
