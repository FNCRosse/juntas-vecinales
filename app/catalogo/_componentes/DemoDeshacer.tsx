"use client";

import { useState } from "react";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";
import { Interruptor } from "@/componentes/a11y/Interruptor";

// Ejemplo de acción reversible (R-12): se aplica al instante y "Deshacer" la revierte.
export function DemoDeshacer() {
  const [activo, setActivo] = useState(false);
  const [aviso, setAviso] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Interruptor
        etiqueta="Recordatorios de pago"
        descripcion="Un aviso amable cuando tenga una semana pendiente."
        activo={activo}
        alCambiar={(valor) => {
          setActivo(valor);
          setAviso(true);
        }}
      />
      {aviso && (
        <AvisoDeshacer
          texto="El cambio se aplica desde el próximo aviso."
          alDeshacer={() => {
            setActivo(!activo);
            setAviso(false);
          }}
          alCerrar={() => setAviso(false)}
        />
      )}
    </div>
  );
}
