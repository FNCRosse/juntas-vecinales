"use client";
// @HU-ACC-02

import { Volume2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { RUTA_PERFIL } from "@/componentes/a11y/modo";
import { hayVozEnEspanol, suscribirVoces } from "./voces";

// "Leer en voz alta las noticias" (VEC-AYU-03, VEC-TRA-04): guarda la preferencia en el perfil del servidor.
// Es reversible: se aplica al instante y muestra "Listo" con "Deshacer" (R-12). Si el teléfono no tiene voz en español lo dice, en lugar de dejar al vecino sin botones y sin saber por qué.

export function InterruptorVoz({ activoAlInicio }: { activoAlInicio: boolean }) {
  const [activo, setActivo] = useState(activoAlInicio);
  const [falla, setFalla] = useState(false);
  const [hecho, setHecho] = useState<string | null>(null);
  const conVoz = useSyncExternalStore(suscribirVoces, hayVozEnEspanol, () => true);

  async function guardar(nuevo: boolean) {
    setActivo(nuevo);
    setFalla(false);
    setHecho(null);
    try {
      const respuesta = await fetch(RUTA_PERFIL, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sintesisVozActiva: nuevo }),
      });
      if (!respuesta.ok) throw new Error();
      return true;
    } catch {
      setActivo(!nuevo);
      setFalla(true);
      return false;
    }
  }

  async function cambiar(nuevo: boolean) {
    if (await guardar(nuevo))
      setHecho(
        nuevo ? "Cada noticia tendrá un botón Escuchar." : "Las noticias se leen solo en pantalla, sin voz.",
      );
  }

  return (
    <div className="flex flex-col gap-3">
      <Interruptor
        etiqueta="Leer en voz alta las noticias"
        descripcion="Aparece el botón Escuchar en cada noticia."
        activo={activo}
        alCambiar={cambiar}
        icono={<Volume2 aria-hidden className="size-icono shrink-0 text-accion-primaria" />}
      />
      {hecho && (
        <AvisoDeshacer
          texto={hecho}
          alDeshacer={() => void guardar(!activo)}
          alCerrar={() => setHecho(null)}
        />
      )}
      {activo && !conVoz && (
        <MensajeEstado tipo="aviso" titulo="Este teléfono no tiene una voz en español">
          <p>
            Por eso no vemos el botón Escuchar. Puede leer las noticias en pantalla o pedir ayuda a una
            persona.
          </p>
        </MensajeEstado>
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos guardar su preferencia">
          <p>Revise su internet y vuelva a intentarlo.</p>
        </MensajeEstado>
      )}
    </div>
  );
}
