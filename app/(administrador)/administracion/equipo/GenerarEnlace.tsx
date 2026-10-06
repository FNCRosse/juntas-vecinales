"use client";
// @HU-GAR-21

import { Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { fechaYHora } from "@/compartido/fechas";

// Para entregar la invitación en persona o por otro medio cuando el WhatsApp no llega. El enlace sirve
// una sola vez y no queda guardado: se muestra aquí y nada más.
export function GenerarEnlace({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [enlace, setEnlace] = useState<{ url: string; vence: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  async function generar() {
    setTrabajando(true);
    setError(null);
    setCopiado(false);
    const r = await enviarJson<{ enlace: string; vence: string }>(
      `/api/admin/cuentas/${usuarioId}/enlace`,
      "POST",
    );
    setTrabajando(false);
    if (r.ok) setEnlace({ url: r.datos.enlace, vence: r.datos.vence });
    else setError(r.error);
  }

  async function copiar() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace.url);
      setCopiado(true);
    } catch {
      setError("No pudimos copiarlo solo. Seleccione el enlace y cópielo con su teclado.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Boton type="button" variante="secundario" icono={Link2} onClick={generar} disabled={trabajando}>
        {trabajando ? "Generando…" : `Generar enlace para copiar (${nombre})`}
      </Boton>
      {error && (
        <MensajeEstado tipo="error" titulo="No pudimos generar el enlace">
          <p>{error}</p>
        </MensajeEstado>
      )}
      {enlace && (
        <div className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4">
          <Campo
            name={`enlace-${usuarioId}`}
            etiqueta={`Enlace de invitación de ${nombre}`}
            ayuda={`Sirve una sola vez y vence el ${fechaYHora(new Date(enlace.vence))}. Entréguelo solo a esa persona: con él crea la clave de su cuenta. El anterior dejó de servir.`}
            readOnly
            value={enlace.url}
            onFocus={(e) => e.currentTarget.select()}
          />
          <Boton type="button" icono={Copy} onClick={copiar}>
            Copiar el enlace
          </Boton>
          {copiado && (
            <p role="status" className="font-bold text-texto-exito">
              Enlace copiado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
