import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { resumenDeActividad } from "@/modulos/asambleas/aplicacion/movimientosActividad";
import { balanceDeLaActividad } from "@/modulos/transparencia/aplicacion/balances";
import { PublicarBalanceDeActividad } from "./PublicarBalanceDeActividad";

export const metadata: Metadata = { title: "Publicar el balance" };

export default async function Publicar({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { id } = await params;
  const actividad = await verActividad(sesion, id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  // Ya publicado, o la actividad todavía no se hace: no hay nada que publicar aquí.
  if ((await balanceDeLaActividad(sesion, id)) || new Date(actividad.fechaHora) > new Date()) {
    redirect(`/directiva/actividades/${id}`);
  }
  const { totales, gastos } = await resumenDeActividad(sesion, id);
  return (
    <PublicarBalanceDeActividad
      actividadId={id}
      filas={[
        ["Actividad", actividad.nombre],
        [
          "Ingresos",
          `${soles(totales.ingresos)} (${soles(totales.ingresosVirtuales)} por Yape o Plin y ${soles(totales.ingresosEnPuerta)} en la puerta)`,
        ],
        [
          "Costos",
          `${soles(totales.egresos)} · ${gastos.length === 1 ? "1 gasto" : `${gastos.length} gastos`} con comprobante`,
        ],
        [totales.utilidadNeta < 0 ? "Pérdida" : "Utilidad", soles(totales.utilidadNeta)],
      ]}
    />
  );
}
