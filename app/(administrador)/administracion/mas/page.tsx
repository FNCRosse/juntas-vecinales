import type { Metadata } from "next";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";

export const metadata: Metadata = { title: "Más opciones" };

// Más opciones con "Cerrar sesión" (prototipo XMA01 y DMA01): las demás opciones llegan con sus HU.
export default function MasOpciones() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
