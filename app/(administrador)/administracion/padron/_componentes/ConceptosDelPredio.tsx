"use client";
// @HU-GAR-01 @HU-GAR-10

import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import {
  type Concepto,
  CONCEPTOS,
  MAXIMO_POR_CONCEPTO,
  ocupacionEnTexto,
} from "@/modulos/identidad/aplicacion/ocupacion";

// "¿Cuántos hay de cada uno?" (prototipo ADM-PAD-03 y ADM-PAD-08, R-11): cerrado, dice lo que hay en una línea y
// un solo botón "Cambiar las cantidades"; abierto, cada concepto es una fila de selección con su número y
// "Listo" lo cierra. Así la pantalla no lleva doce botones de más y menos.

const ETIQUETA: Record<Concepto, string> = {
  familias: "Familias",
  inquilinos: "Inquilinos",
  autos: "Autos o camionetas",
  motos: "Motos",
  triciclos: "Triciclos o carretas",
  negocios: "Locales de negocio",
};

export function ConceptosDelPredio({
  idBase,
  valores,
  esNegocio,
  ayuda,
  errores = {},
  alCambiar,
}: {
  idBase: string;
  valores: Record<Concepto, number>;
  /** Un negocio puede no tener familias; lo demás pide al menos una. */
  esNegocio: boolean;
  ayuda?: string;
  errores?: Partial<Record<Concepto, string>>;
  alCambiar: (concepto: Concepto, valor: number) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const hayErrores = Object.keys(errores).length > 0;
  const editando = abierto || hayErrores;
  return (
    <section aria-labelledby={`${idBase}-titulo`} className="flex flex-col gap-3">
      <h2 id={`${idBase}-titulo`} className="text-titulo-3">
        ¿Cuántos hay de cada uno?
      </h2>
      {editando ? (
        <>
          {ayuda && <p className="text-texto-secundario">{ayuda}</p>}
          {CONCEPTOS.map((c) => {
            const minimo = c === "familias" && !esNegocio ? 1 : 0;
            return (
              <SelectorEnHoja
                key={c}
                id={`${idBase}.${c}`}
                pregunta={ETIQUETA[c]}
                opciones={Array.from({ length: MAXIMO_POR_CONCEPTO - minimo + 1 }, (_, i) => ({
                  valor: String(i + minimo),
                  etiqueta: String(i + minimo),
                }))}
                valor={String(valores[c])}
                alElegir={(v) => alCambiar(c, Number(v))}
                error={errores[c]}
              />
            );
          })}
          <Boton icono={Check} variante="secundario" onClick={() => setAbierto(false)}>
            Listo
          </Boton>
        </>
      ) : (
        <>
          <p>{ocupacionEnTexto(valores) || "Ninguno"}</p>
          <Boton icono={Pencil} variante="secundario" onClick={() => setAbierto(true)}>
            Cambiar las cantidades
          </Boton>
        </>
      )}
    </section>
  );
}
