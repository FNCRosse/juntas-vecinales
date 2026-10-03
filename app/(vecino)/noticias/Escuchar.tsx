"use client";
// @HU-ACC-02

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { hayVozEnEspanol, suscribirVoces } from "@/app/_accesibilidad/voces";
import { elegirVoz } from "@/modulos/accesibilidad/aplicacion/sintesisVoz";

// Escuchar una noticia (VEC-TRA-04, HU-ACC-02 CA2 y CA3): reproducir, pausar y detener, de 64 px. Si el
// navegador no tiene voz en español, el botón no aparece. Solo suena una noticia a la vez.

type Estado = "detenida" | "leyendo" | "pausada";

const BOTON =
  "inline-flex min-h-16 min-w-16 items-center justify-center gap-2 rounded-control border-(length:--borde-ancho-control) px-4 font-bold cursor-pointer ";
const PRIMARIO = `${BOTON} border-accion-primaria bg-accion-primaria text-texto-invertido hover:bg-accion-primaria-hover`;
const SECUNDARIO = `${BOTON} border-accion-primaria bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover`;

export function Escuchar({ texto, titulo }: { texto: string; titulo: string }) {
  const conVoz = useSyncExternalStore(suscribirVoces, hayVozEnEspanol, () => false);
  const [estado, setEstado] = useState<Estado>("detenida");
  const lectura = useRef<SpeechSynthesisUtterance | null>(null);

  // Al salir de la pantalla la lectura se corta: no sigue sonando en otra página.
  useEffect(
    () => () => {
      if (lectura.current) window.speechSynthesis.cancel();
    },
    [],
  );

  if (!conVoz) return null;

  function leer() {
    const voz = elegirVoz(window.speechSynthesis.getVoices());
    const dicho = new SpeechSynthesisUtterance(texto);
    dicho.lang = voz?.lang.replace("_", "-") ?? "es-PE";
    if (voz) dicho.voice = voz as SpeechSynthesisVoice;
    const terminar = () => {
      if (lectura.current === dicho) {
        lectura.current = null;
        setEstado("detenida");
      }
    };
    dicho.onend = terminar;
    dicho.onerror = terminar;
    window.speechSynthesis.cancel();
    lectura.current = dicho;
    window.speechSynthesis.speak(dicho);
    setEstado("leyendo");
  }

  function pausar() {
    window.speechSynthesis.pause();
    setEstado("pausada");
  }

  function seguir() {
    window.speechSynthesis.resume();
    setEstado("leyendo");
  }

  function detener() {
    lectura.current = null;
    window.speechSynthesis.cancel();
    setEstado("detenida");
  }

  return (
    <div role="group" aria-label={`Escuchar: ${titulo}`} className="flex flex-wrap items-center gap-3">
      {estado === "detenida" && (
        <button type="button" onClick={leer} className={PRIMARIO}>
          <Volume2 aria-hidden className="size-icono shrink-0" />
          Escuchar
        </button>
      )}
      {estado === "leyendo" && (
        <button type="button" onClick={pausar} className={SECUNDARIO}>
          <Pause aria-hidden className="size-icono shrink-0" />
          Pausar
        </button>
      )}
      {estado === "pausada" && (
        <button type="button" onClick={seguir} className={PRIMARIO}>
          <Play aria-hidden className="size-icono shrink-0" />
          Continuar
        </button>
      )}
      {estado !== "detenida" && (
        <button type="button" onClick={detener} className={SECUNDARIO}>
          <Square aria-hidden className="size-icono shrink-0" />
          Detener
        </button>
      )}
      <span role="status" className="text-pequeno text-texto-secundario">
        {estado === "leyendo" ? "Leyendo…" : estado === "pausada" ? "En pausa" : ""}
      </span>
    </div>
  );
}
