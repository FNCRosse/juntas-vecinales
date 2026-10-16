"use client";
// @HU-GAR-15

import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

/**
 * "No mostrar mi ubicación exacta en el mapa": se guarda al tocar y se aplica también a lo anterior.
 * Es reversible: muestra "Listo" con "Deshacer" (R-12).
 */
export function OposicionUbicacion({ activaAlInicio }: { activaAlInicio: boolean }) {
  const [activa, setActiva] = useState(activaAlInicio);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);

  async function cambiar(nueva: boolean) {
    setGuardado(null);
    setFalla(null);
    setActiva(nueva);
    const r = await enviarJson("/api/arco/solicitudes", "POST", { tipo: "OPOSICION", activa: nueva });
    if (r.ok) {
      setGuardado(
        nueva
          ? "En el mapa, sus reportes (también los anteriores) se mostrarán solo por manzana."
          : "Sus reportes volverán a mostrarse en el punto exacto.",
      );
    } else {
      setActiva(!nueva);
      setGuardado(null);
      setFalla(r.error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Interruptor
        etiqueta="No mostrar mi ubicación exacta en el mapa"
        descripcion="Sus reportes se verán solo por manzana, también los que ya hizo."
        activo={activa}
        alCambiar={cambiar}
      />
      {guardado && (
        <AvisoDeshacer
          texto={guardado}
          alDeshacer={async () => {
            await cambiar(!activa);
            setGuardado(null);
          }}
          alCerrar={() => setGuardado(null)}
        />
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se guardó el cambio">
          <p>{falla}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
