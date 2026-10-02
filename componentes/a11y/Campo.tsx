import { CircleX } from "lucide-react";
import type { InputHTMLAttributes } from "react";

// Campo de texto de la guía visual §5.2: etiqueta siempre visible arriba, ayuda y error debajo,
// enlazados con aria-describedby. El error dice qué pasó y cómo corregirlo (WCAG 3.3.1, 3.3.3).

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
};

export function Campo({ etiqueta, ayuda, error, id, name, className, ...resto }: PropsCampo) {
  const idCampo = id ?? `campo-${name}`;
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined;
  const idError = error ? `${idCampo}-error` : undefined;
  const descripcion = [idError, idAyuda].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <label htmlFor={idCampo} className="text-base font-bold">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion}
        className="min-h-control w-full px-4 rounded-control bg-fondo-superficie text-base text-texto-principal border-(length:--borde-ancho-control) border-borde-control hover:border-borde-fuerte aria-invalid:border-borde-error disabled:border-dashed disabled:bg-fondo-deshabilitado disabled:text-texto-deshabilitado"
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

/** Mensaje de error junto al campo o grupo: ícono + texto, nunca solo el color rojo. */
export function MensajeDeCampo({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} className="flex items-start gap-2 text-base text-texto-error">
      <CircleX aria-hidden className="size-icono shrink-0" />
      <span>{children}</span>
    </p>
  );
}
