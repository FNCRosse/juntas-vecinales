import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verComunicado } from "@/modulos/transparencia/aplicacion/comunicados";
import { PublicarComunicado } from "./PublicarComunicado";

export const metadata: Metadata = { title: "Comunicado a la comunidad" };

// DIR-ASA-14 y DIR-ASA-15 (HU-ASA-15): redactar y publicar, en dos pasos. Con ?corrige=… se publica la corrección de un
// comunicado, que empieza con su texto.
export default async function NuevoComunicado({
  searchParams,
}: {
  searchParams: Promise<{ corrige?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { corrige } = await searchParams;
  if (!corrige) return <PublicarComunicado />;
  const original = await verComunicado(sesion, corrige).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return (
    <PublicarComunicado
      corrige={{
        id: original.id,
        titulo: original.titulo,
        cuerpo: original.cuerpo,
        urgencia: original.urgencia,
      }}
    />
  );
}
