"use client";

import { Minus, Plus } from "lucide-react";

// Contador de la pantalla de empadronamiento (prototipo ADM-PAD-03): botones de 48 px (56 en
// Senior) con nombre propio y el valor anunciado al cambiar. Se opera tocando, sin arrastrar.

const BOTON =
  "inline-flex size-tactil shrink-0 items-center justify-center rounded-control border-(length:--borde-ancho-control) " +
  "border-accion-primaria bg-fondo-superficie text-accion-primaria cursor-pointer hover:bg-accion-secundaria-hover " +
  "aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:border-borde-control aria-disabled:text-texto-deshabilitado";

export function Contador({
  id,
  etiqueta,
  ayuda,
  valor,
  minimo = 0,
  maximo,
  error,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor: number;
  minimo?: number;
  maximo: number;
  error?: string;
  alCambiar: (valor: number) => void;
}) {
  const cambiar = (nuevo: number) => {
    if (nuevo >= minimo && nuevo <= maximo) alCambiar(nuevo);
  };
  return (
    <div
      role="group"
      aria-labelledby={`${id}-etiqueta`}
      aria-describedby={error ? `${id}-error` : undefined}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-borde-sutil py-3 last:border-b-0"
    >
      <div className="flex flex-col">
        <span id={`${id}-etiqueta`} className="font-bold">
          {etiqueta}
        </span>
        {ayuda && <span className="text-pequeno text-texto-secundario">{ayuda}</span>}
        {error && (
          <span id={`${id}-error`} className="text-texto-error">
            {error}
          </span>
        )}
      </div>
      <div className="flex items-center gap-separacion">
        <button
          type="button"
          aria-label={`Quitar uno: ${etiqueta}`}
          aria-disabled={valor <= minimo || undefined}
          onClick={() => cambiar(valor - 1)}
          className={BOTON}
        >
          <Minus aria-hidden className="size-icono" />
        </button>
        <output id={id} aria-live="polite" className="min-w-8 text-center text-titulo-3 font-bold">
          {valor}
        </output>
        <button
          type="button"
          aria-label={`Agregar uno: ${etiqueta}`}
          aria-disabled={valor >= maximo || undefined}
          onClick={() => cambiar(valor + 1)}
          className={BOTON}
        >
          <Plus aria-hidden className="size-icono" />
        </button>
      </div>
    </div>
  );
}
