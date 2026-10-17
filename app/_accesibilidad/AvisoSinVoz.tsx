"use client";
// @HU-ACC-02

import { useSyncExternalStore } from "react";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { hayVozEnEspanol, suscribirVoces } from "./voces";

// Con la lectura en voz alta activa, si el teléfono no tiene una voz en español lo dice: así la persona sabe
// por qué no ve el botón Escuchar (VEC-AYU-03 y VEC-TRA-04).
export function AvisoSinVoz() {
  const conVoz = useSyncExternalStore(suscribirVoces, hayVozEnEspanol, () => true);
  if (conVoz) return null;
  return (
    <MensajeEstado tipo="aviso" titulo="Este teléfono no tiene una voz en español">
      <p>
        Por eso no vemos el botón Escuchar. Puede leer las noticias en pantalla o pedir ayuda a una persona.
      </p>
    </MensajeEstado>
  );
}
