import { Bell, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// DIR-INI-04 Más opciones de la directiva (prototipo DMA01): tres categorías y "Cerrar sesión" aparte. Lo que hay
// dentro de cada una está en sus pantallas (DMA03 a DMA05).
export default async function MasOpciones() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Más opciones</h1>
      <div className="flex flex-col gap-separacion">
        <FilaEnlace href="/directiva/mas/cuentas-y-cobros" icono={Wallet} titulo="Cuentas y cobros" />
        <FilaEnlace href="/directiva/mas/comunidad" icono={Users} titulo="Comunidad" />
        <FilaEnlace href="/directiva/mas/seguimiento" icono={Bell} titulo="Seguimiento" />
      </div>
      <div className="mt-12 flex flex-col gap-opuestas">
        <CambiarDePerfil sesion={sesion} actual="directiva" estilo="tarjeta" />
        <BotonCerrarSesion destino="/entrar/equipo" />
      </div>
    </div>
  );
}
