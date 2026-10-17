"use client";
// @HU-ACC-10

import { Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";

// Al entrar por primera vez a una sección se ofrece su guía (CA1); "Ahora no" la omite y no se vuelve a
// ofrecer sola (CA3). En pausa, ofrece seguir donde quedó. "Ahora no" es reversible: muestra "Listo" con
// "Deshacer" (R-12), que la deja en pausa en el paso en que estaba; así se sigue ofreciendo.
export function OfertaDeGuia({
  seccion,
  enPausa,
  paso = 0,
}: {
  seccion: string;
  enPausa: boolean;
  paso?: number;
}) {
  const [estado, setEstado] = useState<"oferta" | "omitida" | "cerrada">("oferta");
  const accion = (accion: string, alPaso?: number) =>
    enviarJson("/api/accesibilidad/onboarding", "POST", { seccion, accion, paso: alPaso });
  if (estado === "cerrada") return null;
  if (estado === "omitida")
    return (
      <AvisoDeshacer
        texto="No le volveremos a ofrecer esta guía. Puede verla cuando quiera en Más, en «Ayuda y accesibilidad»."
        alDeshacer={() => {
          setEstado("oferta");
          void accion("pausar", paso);
        }}
        alCerrar={() => setEstado("cerrada")}
      />
    );
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
              setEstado("omitida");
              void accion("omitir");
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
