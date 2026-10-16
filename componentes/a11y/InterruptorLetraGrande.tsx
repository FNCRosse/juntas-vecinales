"use client";

import { AArrowUp, Check } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { clasesBotonBarra } from "./Boton";
import { cambiarVista } from "./cambiarVista";
import { MensajeEstado } from "./MensajeEstado";

// "Vista grande" (guía visual §5.8, HU-ACC-01): cambia letra, botones, separación y
// cantidad de opciones: cambia el modo al instante en <html> y lo guarda en el perfil del servidor.
// Si no se pudo guardar, el modo se mantiene en este dispositivo y se avisa. El nombre del archivo y
// del componente no cambian: solo el texto visible.

/** El estado vive en <html data-mode>: todos los "Vista grande" de la página muestran lo mismo. */
function suscribir(alCambiar: () => void) {
  const observador = new MutationObserver(alCambiar);
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observador.disconnect();
}
const enSenior = () => document.documentElement.dataset.mode === "senior";

export function InterruptorLetraGrande({ activoAlInicio }: { activoAlInicio: boolean }) {
  const activo = useSyncExternalStore(suscribir, enSenior, () => activoAlInicio);
  const [noGuardado, setNoGuardado] = useState(false);

  async function alternar() {
    setNoGuardado(!(await cambiarVista(!activo)));
  }

  return (
    <>
      <button type="button" aria-pressed={activo} onClick={alternar} className={clasesBotonBarra(activo)}>
        <AArrowUp aria-hidden className="size-icono shrink-0" />
        <span>Vista grande</span>
        {activo && <Check aria-hidden className="size-icono shrink-0" />}
      </button>
      {noGuardado && (
        <div className="col-span-full">
          <MensajeEstado
            tipo="aviso"
            titulo="No pudimos guardar su preferencia. Se mantendrá en este teléfono."
          />
        </div>
      )}
    </>
  );
}
