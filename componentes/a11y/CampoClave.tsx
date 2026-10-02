"use client";

import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";
import { MensajeDeCampo } from "./Campo";

// Campo de clave: se puede pegar y autocompletar (WCAG 3.3.8) y mostrar lo escrito con un botón
// que dice su estado (prototipo VEC-ACC-05, ADM-ENT-01).

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  name: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
};

export function CampoClave({ etiqueta, ayuda, error, name, id, ...resto }: Props) {
  const [visible, setVisible] = useState(false);
  const idCampo = id ?? `campo-${name}`;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;
  const Icono = visible ? EyeOff : Eye;
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={idCampo} className="text-base font-bold">
        {etiqueta}
      </label>
      <div className="flex gap-separacion">
        <input
          id={idCampo}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={[idError, idAyuda].filter(Boolean).join(" ") || undefined}
          className="min-h-control w-full min-w-0 px-4 rounded-control bg-fondo-superficie text-base text-texto-principal border-(length:--borde-ancho-control) border-borde-control hover:border-borde-fuerte aria-invalid:border-borde-error"
          {...resto}
        />
        <button
          type="button"
          aria-pressed={visible}
          aria-controls={idCampo}
          onClick={() => setVisible(!visible)}
          className="inline-flex min-h-control min-w-tactil shrink-0 items-center justify-center gap-2 rounded-control border-(length:--borde-ancho-control) border-accion-primaria bg-fondo-superficie px-3 text-base font-bold text-accion-primaria hover:bg-accion-secundaria-hover"
        >
          <Icono aria-hidden className="size-icono shrink-0" />
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-pequeno text-texto-secundario">
          {ayuda}
        </p>
      )}
      {error && <MensajeDeCampo id={idError}>{error}</MensajeDeCampo>}
    </div>
  );
}
