"use client";
// @HU-GAR-21 @HU-GAR-22 @HU-GAR-23

import { Settings } from "lucide-react";
import type { ReactNode } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { Dialogo } from "@/componentes/a11y/Dialogo";

// Las acciones de cada persona (cambiar rol, quitar acceso, roles de directiva) van detrás de un solo
// botón "Gestionar acceso" que abre una hoja (prototipo ADM-EQU-01): en la lista queda un objetivo por persona y no tres (R-11).
export function AccionesDePersona({
  nombre,
  cargo,
  children,
}: {
  nombre: string;
  /** "Directivo mediador · Personal externo": lo que ya se sabe de la persona. */
  cargo: string;
  children: ReactNode;
}) {
  return (
    <Dialogo
      variante="hoja"
      titulo={`Acceso de ${nombre}`}
      disparador={
        <Boton variante="secundario" icono={Settings} className="self-start">
          Gestionar acceso<span className="sr-only"> de {nombre}</span>
        </Boton>
      }
    >
      <p className="font-bold">{cargo}</p>
      <div className="flex flex-col gap-separacion">{children}</div>
    </Dialogo>
  );
}
