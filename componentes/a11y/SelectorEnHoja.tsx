"use client";
// @HU-ACC-09

import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { MensajeDeCampo } from "./Campo";
import { clasesOpcionHoja, Dialogo } from "./Dialogo";

// Fila de selección del prototipo (C-20): en la pantalla queda un solo objetivo con lo elegido y
// "Cambiar"; las opciones se abren en una hoja inferior (R-11, un botón en vez de una opción por fila).

export type OpcionSelector<T extends string> = { valor: T; etiqueta: string; detalle?: string };

export function SelectorEnHoja<T extends string>({
  id,
  pregunta,
  vacio = "Elegir una opción",
  opciones,
  valor,
  alElegir,
  error,
  mostrar,
}: {
  id: string;
  pregunta: string;
  /** Lo que dice el botón mientras no se ha elegido nada. */
  vacio?: string;
  opciones: OpcionSelector<T>[];
  valor: T | null;
  alElegir: (valor: T) => void;
  error?: string;
  /** Lo que se ve como elegido cuando no es una de las opciones (por ejemplo, un lugar con su referencia). */
  mostrar?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegida = opciones.find((o) => o.valor === valor);
  return (
    <div className="flex flex-col gap-3">
      <span id={`${id}-pregunta`} className="font-bold">
        {pregunta}
      </span>
      <Dialogo
        variante="hoja"
        titulo={pregunta}
        abierto={abierto}
        alCambiar={setAbierto}
        disparador={
          <button
            type="button"
            id={id}
            aria-haspopup="dialog"
            aria-labelledby={`${id}-pregunta ${id}`}
            aria-describedby={error ? `${id}-error` : undefined}
            className="flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie px-4 py-2 text-left text-base text-texto-principal cursor-pointer hover:bg-accion-secundaria-hover aria-invalid:border-borde-error"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <strong>{mostrar ?? elegida?.etiqueta ?? vacio}</strong>
              {elegida?.detalle && (
                <span className="text-pequeno text-texto-secundario">{elegida.detalle}</span>
              )}
            </span>
            <span className="shrink-0 font-bold text-texto-enlace underline underline-offset-4">Cambiar</span>
          </button>
        }
      >
        <ul className="flex flex-col gap-separacion">
          {opciones.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                aria-pressed={o.valor === valor}
                onClick={() => {
                  alElegir(o.valor);
                  setAbierto(false);
                }}
                className={clasesOpcionHoja(o.valor === valor)}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong>{o.etiqueta}</strong>
                  {o.detalle && <span className="text-pequeno text-texto-secundario">{o.detalle}</span>}
                </span>
                {o.valor === valor && (
                  <CircleCheck aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </Dialogo>
      {error && <MensajeDeCampo id={`${id}-error`}>{error}</MensajeDeCampo>}
    </div>
  );
}
