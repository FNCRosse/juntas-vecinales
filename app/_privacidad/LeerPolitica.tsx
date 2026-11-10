"use client";

import { ChevronLeft, FileText } from "lucide-react";
import { CerrarDialogo, Dialogo } from "@/componentes/a11y/Dialogo";
import { TextoDePolitica } from "./TextoDePolitica";

/**
 * «Leer la política de privacidad» desde un formulario (VEC-07, MED-03): se abre encima, sin salir de la pantalla,
 * y «Volver al reporte» la cierra con lo escrito intacto. Antes se abría en otra pestaña, cuyo «Volver» llevaba al
 * inicio en vez de al formulario.
 */
export function LeerPolitica() {
  return (
    <Dialogo
      variante="hoja"
      titulo="Política de privacidad"
      disparador={
        <button
          type="button"
          className="inline-flex min-h-tactil cursor-pointer items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
        >
          <FileText aria-hidden className="size-icono shrink-0" />
          Leer la política de privacidad
        </button>
      }
    >
      <p>Así cuida la junta los datos de cada vecino, según la Ley N.° 29733.</p>
      <TextoDePolitica nivel={3} />
      <CerrarDialogo asChild>
        <button
          type="button"
          className="inline-flex min-h-tactil cursor-pointer items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver al reporte
        </button>
      </CerrarDialogo>
    </Dialogo>
  );
}
