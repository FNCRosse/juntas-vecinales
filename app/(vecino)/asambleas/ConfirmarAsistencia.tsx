"use client";
// @HU-ASA-02

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// VEC-ASA-02: el estado de la confirmación dentro de VEC-ASA-01. Confirmar asistencia es reversible hasta
// el plazo («Cambiar mi respuesta»), así que es una acción directa, sin paso de confirmación (R-12).
export function ConfirmarAsistencia({
  asambleaId,
  confirmado: inicial,
  plazoAbierto,
  plazoTexto,
}: {
  asambleaId: string;
  confirmado: boolean;
  plazoAbierto: boolean;
  plazoTexto: string;
}) {
  const router = useRouter();
  const [confirmado, setConfirmado] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function cambiar(metodo: "POST" | "DELETE") {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/asistencia`, metodo);
    setEnviando(false);
    if (r.ok) {
      setConfirmado(metodo === "POST");
      router.refresh();
    } else setFalla(r.error);
  }

  if (!plazoAbierto) {
    return (
      <p className="text-texto-secundario">
        {confirmado
          ? "Su casa confirmó que asistirá. El plazo para cambiar la respuesta ya cerró."
          : "El plazo para confirmar la asistencia ya cerró."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo guardar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      {confirmado ? (
        <>
          <p className="font-bold">Usted confirmó que asistirá (una confirmación por su casa).</p>
          <Boton
            type="button"
            variante="secundario"
            icono={X}
            cargando={enviando}
            onClick={() => cambiar("DELETE")}
          >
            Cambiar mi respuesta: ya no podré ir
          </Boton>
        </>
      ) : (
        <>
          <p>Puede confirmar hasta {plazoTexto}.</p>
          <Boton type="button" icono={Check} cargando={enviando} onClick={() => cambiar("POST")}>
            Sí, asistiré
          </Boton>
        </>
      )}
    </div>
  );
}
