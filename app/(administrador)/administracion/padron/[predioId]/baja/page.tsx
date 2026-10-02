import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";
import { MOTIVOS_BAJA_RESIDENTE } from "@/modulos/identidad/aplicacion/gestionarPadron";
import { DarDeBaja } from "./DarDeBaja";

export const metadata: Metadata = { title: "Dar de baja a un residente" };

// ADM-PAD-10 y ADM-PAD-11 (HU-GAR-09).
export default async function Baja({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const vivienda = await verVivienda(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  if (!vivienda.residentes.length) notFound();
  return (
    <DarDeBaja
      predioId={vivienda.id}
      direccion={vivienda.direccion}
      residentes={vivienda.residentes.map((r) => ({
        usuarioId: r.usuarioId,
        etiqueta: `${r.nombre} · ${r.relacion.toLowerCase()} · DNI terminado en ${r.dni.slice(-2)}`,
        nombre: r.nombre,
        relacion: r.relacion,
      }))}
      motivos={MOTIVOS_BAJA_RESIDENTE}
    />
  );
}
