import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";

export const metadata: Metadata = { title: "Inicio" };

// VEC-ACC-09 Inicio del vecino. Los bloques de avisos, cuota, quejas y eventos llegan con
// HU-GAR-19 y los módulos M3 a M5.
export default async function Inicio() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const ahora = new Date();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-titulo-1">
        {saludo(ahora)}, {primerNombre(sesion.nombreCompleto)}
      </h1>
      <p className="text-texto-secundario">{fechaLarga(ahora)}</p>
    </div>
  );
}
