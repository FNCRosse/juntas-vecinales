"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

// Interruptor de la guía visual (prototipo C-08): botón con role="switch" y el estado escrito
// ("Sí" / "No") además del color (WCAG 1.4.1). Toda la fila es pulsable. El riel mide 56 × 32 px
// (72 × 40 en vista grande) y la perilla encendida lleva un ✓.

export function Interruptor({
  etiqueta,
  descripcion,
  activo,
  alCambiar,
  icono,
  sinBorde = false,
}: {
  etiqueta: string;
  descripcion?: string;
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  icono?: ReactNode;
  /** Dentro de una tarjeta, la fila va sin borde ni relleno, como en el prototipo. */
  sinBorde?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className={`flex min-h-16 w-full cursor-pointer items-center gap-3 text-left text-base text-texto-principal ${
        sinBorde
          ? "bg-transparent"
          : "rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie px-4 py-2 hover:border-borde-fuerte"
      }`}
    >
      {icono}
      <span className="flex min-w-0 flex-1 flex-col">
        <strong>{etiqueta}</strong>
        {descripcion && <span className="text-pequeno text-texto-secundario">{descripcion}</span>}
      </span>
      <span
        aria-hidden
        className={`flex h-8 w-14 shrink-0 items-center rounded-pastilla px-1 senior:h-10 senior:w-18 ${
          activo
            ? "justify-end bg-accion-primaria"
            : "justify-start border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
        }`}
      >
        {activo ? (
          <span className="flex size-6 items-center justify-center rounded-pastilla bg-fondo-superficie text-accion-primaria senior:size-8">
            <Check className="size-icono-pequeno" />
          </span>
        ) : (
          <span className="size-6 rounded-pastilla bg-borde-control senior:size-8" />
        )}
      </span>
      <strong className="min-w-8 shrink-0">{activo ? "Sí" : "No"}</strong>
    </button>
  );
}
