import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";
import { ActualizarPredio } from "./ActualizarPredio";

export const metadata: Metadata = { title: "Actualizar el predio" };

// ADM-PAD-08 y ADM-PAD-09 (HU-GAR-10).
export default async function Actualizar({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const vivienda = await verVivienda(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return (
    <ActualizarPredio predioId={vivienda.id} direccion={vivienda.direccion} actual={vivienda.ocupacion} />
  );
}
