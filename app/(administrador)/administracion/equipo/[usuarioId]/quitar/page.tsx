import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { MOTIVOS_BAJA, verMiembro } from "@/modulos/identidad/aplicacion/equipo";
import { QuitarAcceso } from "./QuitarAcceso";

export const metadata: Metadata = { title: "Quitar acceso" };

// ADM-EQU-07 y ADM-EQU-08 (HU-GAR-22).
export default async function QuitarAccesoPagina({ params }: { params: Promise<{ usuarioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const miembro = await verMiembro(sesion, (await params).usuarioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return <QuitarAcceso miembro={miembro} motivos={MOTIVOS_BAJA} />;
}
