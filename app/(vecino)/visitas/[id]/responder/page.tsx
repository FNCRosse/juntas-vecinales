import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { visitaPorResponder } from "@/modulos/identidad/aplicacion/garita";
import { ResponderVisita } from "./ResponderVisita";

export const metadata: Metadata = { title: "Visita en la garita" };

// VEC-GAR-05 Visita no anunciada en la garita (HU-GAR-07 CA2 y CA3): la casa decide si la deja pasar.
// La visita de otra casa da 404 (AC-7).
export default async function Responder({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const visita = await visitaPorResponder(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return <ResponderVisita visita={visita} />;
}
