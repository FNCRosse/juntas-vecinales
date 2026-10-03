"use client";
// @HU-ACC-10

import { Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";

// Al entrar por primera vez a una sección se ofrece su guía (CA1); "Ahora no" la omite y no se vuelve a
// ofrecer sola (CA3). En pausa, ofrece seguir donde quedó.
export function OfertaDeGuia({ seccion, enPausa }: { seccion: string; enPausa: boolean }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div
      role="note"
      className="flex gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-info bg-fondo-info p-4 senior:p-6"
    >
      <Info aria-hidden className="size-icono shrink-0 text-texto-info" />
      <div className="flex flex-1 flex-col gap-2">
        <strong>
          {enPausa ? "¿Sigue con la guía de esta sección?" : "¿Quiere ver cómo funciona esta sección?"}
        </strong>
        <span>Es una guía corta y opcional. Puede dejarla cuando quiera.</span>
        <div className="flex flex-wrap gap-separacion">
          <Link
            href={`/guia/${seccion.toLowerCase()}`}
            className="inline-flex min-h-tactil items-center rounded-control border-(length:--borde-ancho-control) border-accion-primaria bg-fondo-superficie px-4 font-bold text-accion-primaria no-underline hover:bg-accion-secundaria-hover"
          >
            {enPausa ? "Seguir la guía" : "Ver la guía"}
          </Link>
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              void enviarJson("/api/accesibilidad/onboarding", "POST", { seccion, accion: "omitir" });
            }}
            className="inline-flex min-h-tactil items-center px-4 font-bold text-texto-enlace underline underline-offset-4 cursor-pointer"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
