import type { Metadata } from "next";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { fechaLarga } from "@/compartido/fechas";

export const metadata: Metadata = { title: "Garita principal" };

// VIG-INI-01. Las acciones de la garita, las visitas anunciadas y quién está dentro llegan con HU-GAR-04 a 08.
export default function InicioGarita() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Garita principal</h1>
        <p className="text-texto-secundario">{fechaLarga(new Date())}</p>
      </div>
      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
