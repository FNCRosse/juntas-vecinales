import type { Metadata } from "next";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// Más opciones (prototipo XMA01): lo que no cabe en la barra (en Senior, Privacidad) y "Cerrar sesión".
export default function MasOpciones() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <TarjetaEnlace href="/administracion/privacidad" titulo="Solicitudes de privacidad">
        <span>Acceso, rectificación, cancelación y oposición de los vecinos.</span>
      </TarjetaEnlace>
      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
