"use client";
// @HU-ACC-03

import { Check, ChevronLeft, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import { Boton } from "./Boton";
import { MensajeEstado } from "./MensajeEstado";

// Paso 2 de 2 de una acción de la administración (prototipo XCF01 a XCF04): resumen, qué pasará,
// "Sí, …", "Corregir algo" (vuelve sin borrar nada) y "Cancelar, no guardar nada" (HU-ACC-03, WCAG 3.3.4).

export function PasoConfirmacion({
  referencia,
  paso = "Paso 2 de 2",
  titulo,
  filas,
  efecto,
  peligro,
  textoConfirmar,
  enviando,
  error,
  alConfirmar,
  alCorregir,
  hrefCancelar,
}: {
  /** El título recibe el foco al llegar a este paso. */
  referencia?: RefObject<HTMLHeadingElement | null>;
  paso?: string;
  titulo: string;
  filas: [etiqueta: string, valor: string][];
  efecto: string;
  /** Acción que no se puede deshacer: botón de peligro y la advertencia en un recuadro. */
  peligro?: { titulo: string; texto: string };
  textoConfirmar: string;
  enviando: boolean;
  error?: string | null;
  alConfirmar: () => void;
  alCorregir: () => void;
  hrefCancelar: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={alCorregir}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4 cursor-pointer"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver y corregir
      </button>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">{paso}</p>
        <h1 ref={referencia} tabIndex={-1} className="text-titulo-1">
          {titulo}
        </h1>
      </div>
      <dl className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
            <dd className="font-bold">{valor}</dd>
          </div>
        ))}
      </dl>
      <p>{efecto}</p>
      {peligro && (
        <MensajeEstado tipo="error" titulo={peligro.titulo}>
          <p>{peligro.texto}</p>
        </MensajeEstado>
      )}
      {error && (
        <MensajeEstado tipo="error" titulo="No se guardó nada">
          <p>{error}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        <Boton
          variante={peligro ? "peligro" : "primario"}
          icono={peligro ? TriangleAlert : Check}
          anchoCompleto
          cargando={enviando}
          onClick={alConfirmar}
        >
          {textoConfirmar}
        </Boton>
        <Boton variante="secundario" icono={Pencil} anchoCompleto onClick={alCorregir}>
          Corregir algo
        </Boton>
        <Link
          href={hrefCancelar}
          className="inline-flex min-h-tactil items-center justify-center font-bold text-texto-enlace"
        >
          Cancelar, no guardar nada
        </Link>
      </div>
    </div>
  );
}
