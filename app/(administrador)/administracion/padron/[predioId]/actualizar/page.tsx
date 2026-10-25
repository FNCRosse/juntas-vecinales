import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { primerNombre } from "@/compartido/fechas";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { cuotaDeHoy, tarifaDelPadron } from "@/modulos/aportes/aplicacion/cuotaDelPadron";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";
import { ActualizarPredio } from "./ActualizarPredio";

export const metadata: Metadata = { title: "Actualizar el predio" };

// ADM-PAD-08 y ADM-PAD-09 (HU-GAR-10): con la cuota semanal de hoy y la del siguiente ciclo, de la tarifa que aprobó la directiva.
export default async function Actualizar({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const vivienda = await verVivienda(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const [tarifa, hoy] = await Promise.all([tarifaDelPadron(), cuotaDeHoy(vivienda.id)]);
  const placasDe = (tipo: "auto" | "moto") =>
    vivienda.vehiculos.filter((v) => v.tipo === tipo).map((v) => v.placa);
  return (
    <ActualizarPredio
      predioId={vivienda.id}
      direccion={vivienda.direccion}
      actual={vivienda.ocupacion}
      placasActuales={{ autos: placasDe("auto"), motos: placasDe("moto") }}
      conceptos={tarifa.conceptos}
      desde={tarifa.desde}
      hoy={hoy}
      titular={vivienda.residentes[0] ? primerNombre(vivienda.residentes[0].nombre) : "la casa"}
    />
  );
}
