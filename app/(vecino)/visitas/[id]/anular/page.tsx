import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verVisita } from "@/modulos/identidad/aplicacion/visitas";
import { AnularVisita } from "./AnularVisita";

export const metadata: Metadata = { title: "Anular una visita" };

// VEC-GAR-04 Anular una visita (HU-GAR-05): confirmación con salida.
export default async function Anular({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const visita = await verVisita(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return <AnularVisita id={visita.id} nombre={visita.nombre} cuando={visita.cuando} />;
}
