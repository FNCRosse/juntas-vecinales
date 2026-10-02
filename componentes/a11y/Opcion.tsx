// @HU-ACC-09
import type { InputHTMLAttributes, ReactNode } from "react";
import { MensajeDeCampo } from "./Campo";

// Checkbox y radio de la guía visual §5.4: control nativo y toda la fila pulsable, de 48 px
// (56 en Senior), aunque la caja mida 24 px (HU-ACC-09 CA1).

type PropsOpcion = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  tipo: "radio" | "checkbox";
  etiqueta: string;
};

export function Opcion({ tipo, etiqueta, className, ...resto }: PropsOpcion) {
  return (
    <label
      className={`flex items-center gap-3 min-h-tactil px-2 rounded-control text-base cursor-pointer hover:bg-fondo-suave ${className ?? ""}`}
    >
      <input type={tipo} className="size-icono shrink-0 accent-accion-primaria" {...resto} />
      <span>{etiqueta}</span>
    </label>
  );
}

/** Grupo con su pregunta (legend) y, si falta elegir, el error que dice cómo seguir. */
export function GrupoOpciones({
  pregunta,
  error,
  id,
  children,
}: {
  pregunta: string;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  const idError = error ? `${id}-error` : undefined;
  return (
    <fieldset
      id={id}
      aria-describedby={idError}
      className={`flex flex-col gap-separacion rounded-control ${error ? "border-(length:--borde-ancho-control) border-borde-error p-4" : ""}`}
    >
      <legend className="mb-3 text-base font-bold">{pregunta}</legend>
      {children}
      {error && <MensajeDeCampo id={idError}>{error}</MensajeDeCampo>}
    </fieldset>
  );
}
