import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";

export const metadata: Metadata = { title: "Panel de administración" };

// ADM-INI-01. Las bandejas (privacidad, auditoría, garita) llegan con sus HU.
export default async function PanelAdministracion() {
  const sesion = await sesionActual();
  const ahora = new Date();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-titulo-1">
        {saludo(ahora)}, {primerNombre(sesion?.nombreCompleto ?? "")}
      </h1>
      <p className="text-texto-secundario">{fechaLarga(ahora)} · Administración</p>
    </div>
  );
}
