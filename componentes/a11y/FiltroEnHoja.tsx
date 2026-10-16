"use client";
// @HU-ACC-09

import { Check, ListFilter } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { clasesBoton } from "./Boton";
import { CerrarDialogo, Dialogo } from "./Dialogo";

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
        <button type="button" className={clasesBoton("secundario", true)}>
          <ListFilter aria-hidden className="size-icono shrink-0" />
          <span>
            {etiquetaBoton}: {actual}
          </span>
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
                  className={`flex min-h-tactil items-center gap-2 rounded-control border-(length:--borde-ancho-control) px-4 font-bold no-underline ${o.activa ? "border-accion-primaria bg-fondo-suave text-accion-primaria" : "border-borde-control bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover"}`}
                >
                  {o.activa && <Check aria-hidden className="size-icono-pequeno" />}
                  {o.etiqueta}
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
