"use client";
// @HU-COB-12

import { Check } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Confirmación interactiva de que la casa recibió su recibo (HU-COB-12 CA3). No mueve dinero ni se corrige después:
// un solo toque.
export function ConfirmarRecibo({ reciboId }: { reciboId: string }) {
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/aportes/recibos/${reciboId}/confirmar`, "POST");
    setEnviando(false);
    if (r.ok) setConfirmado(true);
    else setFalla(r.error);
  }

  if (confirmado) {
    return (
      <MensajeEstado tipo="exito" titulo="Gracias, ya lo anotamos">
        <p>La directiva sabe que recibió su recibo.</p>
      </MensajeEstado>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo anotar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="button" icono={Check} anchoCompleto cargando={enviando} onClick={confirmar}>
        Confirmar que lo recibí
      </Boton>
    </div>
  );
}
