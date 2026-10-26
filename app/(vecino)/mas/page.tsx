import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// VEC-ACC-16 Más opciones: lista plana de cuatro filas (R-11; prototipo del 15 de octubre). Lo demás
// se abre desde el inicio (Mis avisos, Mis reportes, Noticias) o desde su pantalla: "Qué avisos
// recibo" desde Avisos, la guía rápida desde Ayuda y accesibilidad, las actas desde Transparencia.
export default async function MasOpciones() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <div className="flex flex-col gap-separacion">
        <TarjetaEnlace href="/visitas" titulo="Mis visitas" />
        <TarjetaEnlace href="/transparencia/cuentas" titulo="Cuentas del barrio" />
        <TarjetaEnlace href="/transparencia" titulo="Actas y balances" />
        <TarjetaEnlace href="/mas/perfil" titulo="Mi perfil y privacidad" />
        <TarjetaEnlace href="/mas/ayuda-y-accesibilidad" titulo="Ayuda y accesibilidad" />
      </div>
      <CambiarDePerfil sesion={sesion} actual="vecino" estilo="tarjeta" />
      <BotonCerrarSesion destino="/entrar" />
    </div>
  );
}
