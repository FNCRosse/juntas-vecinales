import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";

export const metadata: Metadata = { title: "Resumen de la directiva" };

// DIR-INI-01. Las bandejas y lo que se puede crear llegan con las HU de cada módulo.
export default async function ResumenDirectiva() {
  const sesion = await sesionActual();
  const ahora = new Date();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-titulo-1">
        {saludo(ahora)}, {primerNombre(sesion?.nombreCompleto ?? "")}
      </h1>
      <p className="text-texto-secundario">{fechaLarga(ahora)} · Resumen de la directiva</p>
    </div>
  );
}
