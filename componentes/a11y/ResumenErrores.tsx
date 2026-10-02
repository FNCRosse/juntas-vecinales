"use client";

import { CircleX } from "lucide-react";
import { useEffect, useRef } from "react";

// Resumen de errores al inicio del formulario (FRONTEND.md §7): recibe el foco cuando hay varios y
// cada error es un enlace a su campo (WCAG 3.3.1).

export function ResumenErrores({ errores }: { errores: { campo: string; mensaje: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errores.length) ref.current?.focus();
  }, [errores]);
  if (!errores.length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="flex flex-col gap-2 rounded-control border-(length:--borde-ancho-control) border-borde-error bg-fondo-error p-4 senior:p-6"
    >
      <p className="flex items-center gap-2 font-bold">
        <CircleX aria-hidden className="size-icono shrink-0 text-texto-error" />
        {errores.length === 1 ? "Falta corregir un dato" : `Faltan corregir ${errores.length} datos`}
      </p>
      <ul className="flex flex-col gap-1">
        {errores.map(({ campo, mensaje }) => (
          <li key={campo}>
            <a href={`#${campo}`} className="text-texto-enlace underline underline-offset-4">
              {mensaje}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
