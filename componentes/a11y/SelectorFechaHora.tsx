"use client";
// @HU-ASA-01

import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Boton } from "./Boton";
import { Campo, MensajeDeCampo } from "./Campo";
import { CerrarDialogo, Dialogo } from "./Dialogo";

// Fila «fecha y hora» del prototipo: un solo objetivo con lo elegido y «Cambiar»; la fecha y la hora se
// escriben en una hoja con «Listo» (R-11: dos campos sueltos sumaban un objetivo más a la pantalla).

const ZONA = "America/Lima";

/** "2026-11-14" y "18:00" → "Sábado 14 de noviembre de 2026, 6:00 p. m.", o "" si falta alguno. */
function enPalabras(fecha: string, hora: string) {
  if (!fecha || !hora) return "";
  const cuando = new Date(`${fecha}T${hora}:00-05:00`);
  if (Number.isNaN(cuando.getTime())) return "";
  const dia = new Intl.DateTimeFormat("es-PE", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(cuando)
    .replace(",", "");
  const horaTexto = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, timeStyle: "short", hour12: true })
    .format(cuando)
    .replace(/[  ]/g, " ");
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${horaTexto}`;
}

export { enPalabras as fechaHoraEnPalabras };

export function SelectorFechaHora({
  id,
  pregunta = "Fecha y hora",
  fecha,
  hora,
  alCambiar,
  error,
}: {
  id: string;
  pregunta?: string;
  fecha: string;
  hora: string;
  alCambiar: (cambio: { fecha: string; hora: string }) => void;
  error?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegida = enPalabras(fecha, hora);
  return (
    <div className="flex flex-col gap-3">
      <span id={`${id}-pregunta`} className="font-bold">
        {pregunta}
      </span>
      <Dialogo
        variante="hoja"
        titulo={pregunta}
        abierto={abierto}
        alCambiar={setAbierto}
        disparador={
          <button
            type="button"
            id={id}
            aria-haspopup="dialog"
            aria-labelledby={`${id}-pregunta ${id}`}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie px-4 py-2 text-left text-base text-texto-principal cursor-pointer hover:bg-accion-secundaria-hover ${error ? "border-borde-error" : ""}`}
          >
            <strong className="min-w-0 flex-1">{elegida || "Elegir fecha y hora"}</strong>
            <span className="inline-flex shrink-0 items-center gap-1 font-bold text-texto-enlace">
              Cambiar
              <ChevronRight aria-hidden className="size-icono-pequeno" />
            </span>
          </button>
        }
      >
        <Campo
          type="date"
          id={`${id}-fecha`}
          name={`${id}-fecha`}
          etiqueta="Fecha"
          value={fecha}
          onChange={(e) => alCambiar({ fecha: e.target.value, hora })}
        />
        <Campo
          type="time"
          id={`${id}-hora`}
          name={`${id}-hora`}
          etiqueta="Hora"
          value={hora}
          onChange={(e) => alCambiar({ fecha, hora: e.target.value })}
        />
        <CerrarDialogo asChild>
          <Boton type="button" icono={Check} anchoCompleto>
            Listo
          </Boton>
        </CerrarDialogo>
      </Dialogo>
      {error && <MensajeDeCampo id={`${id}-error`}>{error}</MensajeDeCampo>}
    </div>
  );
}
