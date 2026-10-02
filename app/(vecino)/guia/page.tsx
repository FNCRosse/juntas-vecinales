import type { Metadata } from "next";
import { GuiaPrimerUso } from "./_componentes/GuiaPrimerUso";

export const metadata: Metadata = { title: "Guía rápida" };

// VEC-ACC-08 Guía de primer uso, opcional (HU-GAR-03 CA1): se ofrece al terminar el primer ingreso
// y se puede volver a ver desde Más.
export default function Guia() {
  return <GuiaPrimerUso />;
}
