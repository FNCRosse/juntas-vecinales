"use client";
// @HU-GAR-03

import { ArrowRight, CircleHelp, Pause, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Tres pasos como máximo, uno a la vez; se puede pausar o saltar (prototipo VEC-ACC-08). El último
// ofrece el acceso directo: con el aviso del navegador si existe; si no, cómo hacerlo a mano.

type AvisoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const PASOS = [
  {
    titulo: "Su cuota, siempre a la vista",
    texto:
      "Apenas entre, verá cuánto paga por semana y si debe algo. No tiene que buscarlo ni preguntarle a nadie.",
    Icono: Wallet,
  },
  {
    titulo: "Si algo se le complica, pida ayuda",
    texto:
      "Arriba de cada pantalla está el botón Pedir ayuda. Alguien de la directiva le llamará o le visitará.",
    Icono: CircleHelp,
  },
  {
    titulo: "Tenga la app en su pantalla",
    texto: "Así la abre con un toque, como WhatsApp, y no tiene que volver a entrar.",
    Icono: Smartphone,
  },
];

export function GuiaPrimerUso() {
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState<AvisoInstalar | null>(null);
  // Solo se muestra en el último paso, después de hidratar: leerlo al iniciar no cambia el HTML.
  const [instalada, setInstalada] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
  );
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    const guardar = (evento: Event) => {
      evento.preventDefault();
      setAviso(evento as AvisoInstalar);
    };
    const alInstalar = () => setInstalada(true);
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const { titulo: textoTitulo, texto, Icono } = PASOS[paso];
  const ultimo = paso === PASOS.length - 1;

  async function instalar() {
    if (!aviso) return;
    await aviso.prompt();
    if ((await aviso.userChoice).outcome === "accepted") setInstalada(true);
    setAviso(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Guía rápida · paso {paso + 1} de {PASOS.length} · es opcional
        </p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {textoTitulo}
        </h1>
      </div>
      <Icono aria-hidden className="size-16 self-center text-accion-primaria" />
      <p>{texto}</p>

      {ultimo &&
        (instalada ? (
          <MensajeEstado tipo="exito" titulo="Ya la tiene en su pantalla de inicio">
            <p>Ábrala con un toque desde el ícono de la junta.</p>
          </MensajeEstado>
        ) : aviso ? (
          <Boton variante="secundario" icono={Smartphone} anchoCompleto onClick={instalar}>
            Agregar a mi pantalla de inicio
          </Boton>
        ) : (
          <div className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6">
            <p className="font-bold">Cómo agregarla</p>
            <p>En Android: toque el menú de los tres puntos y elija «Agregar a la pantalla principal».</p>
            <p>En iPhone: toque el botón Compartir y elija «Agregar a inicio».</p>
          </div>
        ))}

      <div className="flex flex-col gap-separacion">
        {ultimo ? (
          <BotonEnlace href="/" icono={ArrowRight} anchoCompleto>
            Terminar e ir al inicio
          </BotonEnlace>
        ) : (
          <Boton icono={ArrowRight} anchoCompleto onClick={() => setPaso(paso + 1)}>
            Siguiente
          </Boton>
        )}
        {!ultimo && (
          <Link
            href="/"
            className="inline-flex min-h-tactil items-center justify-center gap-2 font-bold text-texto-enlace"
          >
            <Pause aria-hidden className="size-icono" />
            Pausar y seguir después
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex min-h-tactil items-center justify-center font-bold text-texto-enlace"
        >
          Saltar la guía
        </Link>
      </div>
      {!ultimo && <p className="text-texto-secundario">Puede volver a verla desde Más, en «Guía rápida».</p>}
    </div>
  );
}
