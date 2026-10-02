import type { Metadata } from "next";
import { PreguntarAlVecino } from "./PreguntarAlVecino";

export const metadata: Metadata = { title: "Visita no anunciada" };

// VIG-VIS-03 Visita no anunciada · paso 1 de 2 (HU-GAR-07 CA2). Llega con lo escrito al buscar.
export default async function VisitaNoAnunciada({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; dni?: string }>;
}) {
  const { nombre = "", dni = "" } = await searchParams;
  return <PreguntarAlVecino nombre={nombre.slice(0, 120)} dni={/^\d{8}$/.test(dni) ? dni : ""} />;
}
