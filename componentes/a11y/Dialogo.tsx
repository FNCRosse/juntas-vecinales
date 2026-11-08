"use client";
// @HU-ACC-06

import * as Radix from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// Diálogo y hoja sobre Radix: foco dentro mientras está abierto, Escape y "Cerrar" siempre salen
// y el foco vuelve al botón que lo abrió (HU-ACC-06 CA3). La hoja sube desde abajo en el teléfono.

export type PropsDialogo = {
  /** Botón que abre el diálogo; se usa tal cual (asChild). */
  disparador: ReactNode;
  titulo: string;
  descripcion?: string;
  variante?: "dialogo" | "hoja";
  abierto?: boolean;
  alCambiar?: (abierto: boolean) => void;
  children: ReactNode;
};

const POSICION = {
  dialogo: "inset-4 m-auto h-fit max-h-full max-w-180 rounded-tarjeta",
  hoja: "inset-x-0 bottom-0 mx-auto max-h-full max-w-180 rounded-t-tarjeta",
};

export function Dialogo({
  disparador,
  titulo,
  descripcion,
  variante = "dialogo",
  abierto,
  alCambiar,
  children,
}: PropsDialogo) {
  return (
    <Radix.Root open={abierto} onOpenChange={alCambiar}>
      <Radix.Trigger asChild>{disparador}</Radix.Trigger>
      <Radix.Portal>
        <Radix.Overlay className="fixed inset-0 z-40 bg-texto-principal/60" />
        <Radix.Content
          className={`fixed z-50 flex flex-col gap-6 overflow-y-auto border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-elevada ${POSICION[variante]}`}
          // Sin descripción, Radix pide declararlo para no enlazar una que no existe.
          {...(descripcion ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-separacion">
            <Radix.Title className="text-titulo-2">{titulo}</Radix.Title>
            <Radix.Close
              aria-label="Cerrar"
              className="inline-flex min-h-tactil min-w-tactil shrink-0 items-center justify-center gap-2 rounded-control px-2 text-base font-bold text-texto-principal hover:bg-fondo-suave"
            >
              <X aria-hidden className="size-icono" />
              <span className="hidden senior:inline">Cerrar</span>
            </Radix.Close>
          </div>
          {descripcion && <Radix.Description>{descripcion}</Radix.Description>}
          {children}
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  );
}

/** Opción de una hoja (prototipo C-20): texto oscuro en negrita y, la elegida, borde y ✓ del color de la acción. */
export const clasesOpcionHoja = (elegida: boolean) =>
  `flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) px-4 py-2 text-left text-base text-texto-principal no-underline cursor-pointer ${
    elegida
      ? "border-accion-primaria bg-accion-secundaria-hover"
      : "border-borde-control bg-fondo-superficie hover:bg-accion-secundaria-hover"
  }`;

/** Botón que cierra el diálogo con el aspecto que se le dé (asChild). */
export const CerrarDialogo = Radix.Close;
