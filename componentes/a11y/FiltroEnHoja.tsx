"use client";
// @HU-ACC-09

import { ChevronDown, CircleCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CerrarDialogo, clasesOpcionHoja, Dialogo } from "./Dialogo";

// Los filtros de una lista van detrás de un solo botón "Filtrar: …" que abre una hoja inferior
// (prototipo, R-11): en la pantalla queda un objetivo en vez de uno por opción. Cada opción es un
// enlace (el filtro vive en la URL) y toca para cerrar la hoja.

export type OpcionFiltro = { etiqueta: string; href: string; activa: boolean };

export function FiltroEnHoja({
  actual,
  titulo,
  opciones,
  pie,
  etiquetaBoton = "Filtrar",
}: {
  /** Lo que está aplicado hoy, para el botón: "Filtrar: Todos los avisos". */
  actual: string;
  titulo: string;
  opciones: OpcionFiltro[];
  /** Enlace o texto al final de la hoja (por ejemplo "Elegir qué avisos recibo"). */
  pie?: ReactNode;
  /** Qué dice el botón antes de lo aplicado: "Filtrar" por omisión; "Ver como" para cambiar la vista. */
  etiquetaBoton?: string;
}) {
  return (
    <Dialogo
      variante="hoja"
      titulo={titulo}
      disparador={
        <button
          type="button"
          className="flex min-h-tactil w-full cursor-pointer items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie px-4 py-2 text-left text-base text-texto-principal hover:bg-accion-secundaria-hover"
        >
          <SlidersHorizontal aria-hidden className="size-icono shrink-0 text-accion-primaria" />
          <span className="min-w-0 flex-1">
            <strong>{etiquetaBoton}:</strong> {actual}
          </span>
          <ChevronDown aria-hidden className="size-icono shrink-0" />
        </button>
      }
    >
      <nav aria-label={titulo}>
        <ul className="flex flex-col gap-separacion">
          {opciones.map((o) => (
            <li key={o.href}>
              <CerrarDialogo asChild>
                <Link
                  href={o.href}
                  aria-current={o.activa ? "true" : undefined}
                  className={clasesOpcionHoja(o.activa)}
                >
                  <strong className="min-w-0 flex-1">{o.etiqueta}</strong>
                  {o.activa && (
                    <CircleCheck aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                  )}
                </Link>
              </CerrarDialogo>
            </li>
          ))}
        </ul>
      </nav>
      {pie}
    </Dialogo>
  );
}
