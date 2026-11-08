import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { RegistrarMovimiento } from "./RegistrarMovimiento";

export const metadata: Metadata = { title: "Registrar un gasto o ingreso" };

export default async function Registrar({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const actividad = await verActividad(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return <RegistrarMovimiento actividadId={actividad.id} nombre={actividad.nombre} />;
}
