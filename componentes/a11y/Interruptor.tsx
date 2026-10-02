"use client";

import type { ReactNode } from "react";

// Interruptor de la guía visual (prototipo C-08): botón con role="switch" y el estado escrito
// ("Sí" / "No") además del color (WCAG 1.4.1). Toda la fila es pulsable.

export function Interruptor({
  etiqueta,
  descripcion,
  activo,
  alCambiar,
  icono,
}: {
  etiqueta: string;
  descripcion?: string;
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  icono?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className="flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 text-left text-base text-texto-principal cursor-pointer hover:border-borde-fuerte"
    >
      {icono}
      <span className="flex flex-1 flex-col">
        <strong>{etiqueta}</strong>
        {descripcion && <span className="text-pequeno text-texto-secundario">{descripcion}</span>}
      </span>
      <span
        aria-hidden
        className={`flex h-8 w-16 shrink-0 items-center rounded-pastilla border-(length:--borde-ancho-control) p-1 ${activo ? "justify-end border-accion-primaria bg-accion-primaria" : "justify-start border-borde-fuerte bg-fondo-suave"}`}
      >
        <span className="size-4 rounded-pastilla bg-fondo-superficie shadow-tarjeta" />
      </span>
      <strong className="w-6">{activo ? "Sí" : "No"}</strong>
    </button>
  );
}
