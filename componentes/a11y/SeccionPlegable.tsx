"use client";
// @HU-ACC-09

import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useState } from "react";

// Sección plegable del prototipo (C-21): con `plegable` el contenido queda detrás de un solo botón; sin él,
// se ve completo y no hay botón (R-11: en la vista grande del teléfono los campos opcionales se pliegan).

export function SeccionPlegable({
  titulo,
  plegable,
  abrirSiError = false,
  children,
}: {
  titulo: string;
  plegable: boolean;
  /** Con un error adentro, la sección se muestra abierta para que se vea (WCAG 3.3.1). */
  abrirSiError?: boolean;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  if (!plegable) return <>{children}</>;
  return (
    <>
      <button
        type="button"
        aria-expanded={abierta || abrirSiError}
        onClick={() => setAbierta(!abierta)}
        className="flex min-h-tactil w-full items-center gap-3 rounded-control bg-fondo-suave px-4 py-2 text-left text-titulo-3 font-bold text-texto-principal cursor-pointer"
      >
        <span className="flex-1">{titulo}</span>
        {abierta || abrirSiError ? (
          <ChevronUp aria-hidden className="size-icono shrink-0" />
        ) : (
          <ChevronDown aria-hidden className="size-icono shrink-0" />
        )}
      </button>
      {(abierta || abrirSiError) && children}
    </>
  );
}
