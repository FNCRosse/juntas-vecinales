"use client";
// @HU-ACC-03

import { Undo2, X } from "lucide-react";
import { Boton } from "./Boton";
import { MensajeEstado } from "./MensajeEstado";

// "Listo" con "Deshacer" (prototipo C-18, R-12): las acciones reversibles se aplican al instante, sin
// pedir confirmación, y esto las acompaña. No desaparece solo (WCAG 2.2.1): lo cierra la persona o
// "Deshacer". Las acciones con dinero, voto, denuncia o baja siguen usando `Confirmacion`.

export function AvisoDeshacer({
  texto,
  alDeshacer,
  alCerrar,
}: {
  /** Qué quedó hecho y desde cuándo vale, en una frase. */
  texto: string;
  alDeshacer: () => void;
  alCerrar: () => void;
}) {
  return (
    <MensajeEstado tipo="exito" titulo="Listo.">
      <p>{texto}</p>
      <div className="flex flex-wrap gap-separacion">
        <Boton variante="secundario" icono={Undo2} onClick={alDeshacer}>
          Deshacer
        </Boton>
        <Boton variante="secundario" icono={X} onClick={alCerrar} aria-label="Cerrar aviso">
          Cerrar
        </Boton>
      </div>
    </MensajeEstado>
  );
}
