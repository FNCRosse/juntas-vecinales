// Voces del navegador (Web Speech API) para useSyncExternalStore: se cargan después de abrir la página,
// por eso se escucha "voiceschanged".
import { elegirVoz } from "@/modulos/accesibilidad/aplicacion/sintesisVoz";

const sintetizador = () => (typeof window !== "undefined" ? window.speechSynthesis : undefined);

export function suscribirVoces(alCambiar: () => void) {
  const s = sintetizador();
  s?.addEventListener("voiceschanged", alCambiar);
  return () => s?.removeEventListener("voiceschanged", alCambiar);
}

export const hayVozEnEspanol = () => elegirVoz(sintetizador()?.getVoices() ?? []) !== null;
