"use client";
// @HU-ACC-09

import { useSyncExternalStore } from "react";

// ¿Vista grande en el teléfono? Es el caso en que el prototipo pliega secciones para no pasar de 6
// objetivos por pantalla (R-11). Se lee del <html> y del ancho, así cambia al instante con el botón
// "Vista grande"; el servidor da por hecho el teléfono y el valor que viene del perfil.

const TELEFONO = "(max-width: 47.99rem)";

function suscribir(alCambiar: () => void) {
  const observador = new MutationObserver(alCambiar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  const ancho = window.matchMedia(TELEFONO);
  ancho.addEventListener("change", alCambiar);
  return () => {
    observador.disconnect();
    ancho.removeEventListener("change", alCambiar);
  };
}

export function useVistaGrandeEnTelefono(seniorAlInicio: boolean) {
  return useSyncExternalStore(
    suscribir,
    () => document.documentElement.dataset.mode === "senior" && window.matchMedia(TELEFONO).matches,
    () => seniorAlInicio,
  );
}
