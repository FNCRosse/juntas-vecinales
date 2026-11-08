import { ScrollText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// Más opciones (prototipo XMA01): lo que no cabe en la barra del teléfono (Privacidad y Auditoría) y "Cerrar sesión" aparte.
export default async function MasOpciones() {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Más opciones</h1>
      <div className="flex flex-col gap-separacion">
        <FilaEnlace
          href="/administracion/privacidad"
          icono={ShieldCheck}
          titulo="Solicitudes de privacidad"
        />
        <FilaEnlace href="/administracion/auditoria" icono={ScrollText} titulo="Auditoría" />
      </div>
      <div className="mt-12 flex flex-col gap-3">
        <CambiarDePerfil sesion={sesion} actual="administracion" estilo="tarjeta" />
        <BotonCerrarSesion destino="/entrar/equipo" />
      </div>
    </div>
  );
}
