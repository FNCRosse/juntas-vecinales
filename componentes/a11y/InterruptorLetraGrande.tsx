"use client";

import { AArrowUp, Check } from "lucide-react";
import { useState } from "react";
import { clasesBotonBarra } from "./Boton";
import { MensajeEstado } from "./MensajeEstado";
import { COOKIE_MODO_DISPOSITIVO, RUTA_PERFIL } from "./modo";

// "Letra grande" (guía visual §5.8, HU-ACC-01): cambia el modo al instante en <html> y lo guarda en
// el perfil del servidor. Si no se pudo guardar, el modo se mantiene en este dispositivo y se avisa.

const UN_ANIO_SEGUNDOS = 400 * 24 * 60 * 60;

function aplicarModo(senior: boolean) {
  if (senior) document.documentElement.dataset.mode = "senior";
  else delete document.documentElement.dataset.mode;
}

export function InterruptorLetraGrande({ activoAlInicio }: { activoAlInicio: boolean }) {
  const [activo, setActivo] = useState(activoAlInicio);
  const [noGuardado, setNoGuardado] = useState(false);

  async function alternar() {
    const nuevo = !activo;
    setActivo(nuevo);
    aplicarModo(nuevo);
    let guardado = false;
    try {
      const respuesta = await fetch(RUTA_PERFIL, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ modoSeniorActivo: nuevo }),
      });
      guardado = respuesta.ok;
    } catch {
      guardado = false;
    }
    document.cookie = guardado
      ? `${COOKIE_MODO_DISPOSITIVO}=; Path=/; Max-Age=0; SameSite=Lax`
      : `${COOKIE_MODO_DISPOSITIVO}=${nuevo ? "senior" : "normal"}; Path=/; Max-Age=${UN_ANIO_SEGUNDOS}; SameSite=Lax`;
    setNoGuardado(!guardado);
  }

  return (
    <>
      <button type="button" aria-pressed={activo} onClick={alternar} className={clasesBotonBarra(activo)}>
        <AArrowUp aria-hidden className="size-icono shrink-0" />
        <span>Letra grande</span>
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
