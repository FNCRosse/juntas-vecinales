import { CircleUser, DoorOpen, FileText, HandHeart, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// VEC-ACC-16 Más opciones: lista plana de cuatro filas con ícono (R-11). Lo demás se abre desde el inicio
// (Mis avisos, Mis reportes, Noticias) o desde su pantalla: "Qué avisos recibo" desde Avisos, la guía rápida
// desde Ayuda y accesibilidad y las actas desde Cuentas del barrio. "Cerrar sesión" va aparte, abajo.
export default async function MasOpciones() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Más opciones</h1>
      <div className="flex flex-col gap-separacion">
        <FilaEnlace href="/visitas" icono={DoorOpen} titulo="Mis visitas" />
        <FilaEnlace href="/actividades" icono={HandHeart} titulo="Actividades pro-fondos" />
        <FilaEnlace href="/transparencia/cuentas" icono={FileText} titulo="Transparencia" />
        <FilaEnlace href="/mas/perfil" icono={CircleUser} titulo="Mi perfil y privacidad" />
        <FilaEnlace href="/mas/ayuda-y-accesibilidad" icono={LifeBuoy} titulo="Ayuda y accesibilidad" />
      </div>
      <CambiarDePerfil sesion={sesion} actual="vecino" estilo="tarjeta" />
      <div className="mt-12 flex flex-col">
        <BotonCerrarSesion destino="/entrar" />
      </div>
    </div>
  );
}
