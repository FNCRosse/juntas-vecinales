import { type TextareaHTMLAttributes } from "react";
import { MensajeDeCampo } from "./Campo";

// Área de texto de varias líneas con la misma anatomía que Campo (guía visual §5.2): etiqueta visible
// arriba, ayuda y error debajo enlazados con aria-describedby.

type PropsAreaTexto = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
};

export function AreaTexto({ etiqueta, ayuda, error, id, name, ...resto }: PropsAreaTexto) {
  const idCampo = id ?? `campo-${name}`;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={idCampo} className="text-base font-bold">
        {etiqueta}
      </label>
      <textarea
        id={idCampo}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[idError, idAyuda].filter(Boolean).join(" ") || undefined}
        className="w-full rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 text-base text-texto-principal hover:border-borde-fuerte aria-invalid:border-borde-error"
        {...resto}
      />
      {ayuda && (
        <p id={idAyuda} className="text-pequeno text-texto-secundario">
          {ayuda}
        </p>
      )}
      {error && <MensajeDeCampo id={idError}>{error}</MensajeDeCampo>}
    </div>
  );
}
