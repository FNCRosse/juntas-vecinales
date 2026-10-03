import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// Más opciones (prototipo XMA01): lo que no cabe en la barra (en Senior, Privacidad) y "Cerrar sesión".
export default async function MasOpciones() {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <TarjetaEnlace href="/administracion/privacidad" titulo="Solicitudes de privacidad">
        <span>Acceso, rectificación, cancelación y oposición de los vecinos.</span>
      </TarjetaEnlace>
      <TarjetaEnlace href="/administracion/auditoria" titulo="Auditoría">
        <span>Las acciones importantes de todo el sistema, de solo lectura.</span>
      </TarjetaEnlace>
      <CambiarDePerfil sesion={sesion} actual="administracion" estilo="tarjeta" />
      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
