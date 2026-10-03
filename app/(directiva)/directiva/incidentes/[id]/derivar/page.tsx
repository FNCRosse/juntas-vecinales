import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaLarga } from "@/compartido/fechas";
import { verQuejaParaGestion } from "@/modulos/incidencias/aplicacion/gestion";
import { DerivarReporte } from "./DerivarReporte";

export const metadata: Metadata = { title: "Derivar a una entidad externa" };

// DIR-QUE-06 y DIR-QUE-07 (HU-QUE-07): el expediente se arma solo con los datos del reporte.
export default async function Derivar({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const q = await verQuejaParaGestion(sesion, (await params).id).catch((e) => {
    if (e instanceof ErrorNoEncontrado) notFound();
    throw e;
  });
  if (q.estado !== "RECIBIDO" && q.estado !== "EN_REVISION") notFound();
  return (
    <DerivarReporte
      id={q.id}
      numero={q.numero}
      fecha={fechaLarga(new Date(q.fechaRegistro))}
      expediente={[
        ["Caso", q.categoria],
        ["Lugar y coordenadas", q.coordenadas ? `${q.lugar} (${q.coordenadas})` : q.lugar],
        [
          "Pruebas",
          q.evidencias.length
            ? q.evidencias.map((e) => e.nombre).join(", ")
            : "Relato del vecino, sin foto ni video",
        ],
        ["Quién reporta", q.quien ?? ""],
      ]}
    />
  );
}
