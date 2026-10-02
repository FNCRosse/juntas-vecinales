"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

/** Reenvía el enlace de entrada al WhatsApp del padrón (ADM-PAD-02, HU-GAR-11); el anterior deja de servir. */
export function BotonReenviar({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);

  async function reenviar() {
    setEnviando(true);
    const r = await enviarJson<{ telefonoTerminadoEn: string }>(
      `/api/admin/usuarios/${usuarioId}/enlace`,
      "POST",
    );
    setEnviando(false);
    setResultado(
      r.ok
        ? {
            ok: true,
            texto: `Al WhatsApp terminado en ${r.datos.telefonoTerminadoEn}. El anterior ya no sirve.`,
          }
        : { ok: false, texto: r.error },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Boton variante="secundario" icono={Send} cargando={enviando} onClick={reenviar} className="self-start">
        Reenviar su enlace de entrada a {nombre}
      </Boton>
      {resultado && (
        <MensajeEstado
          tipo={resultado.ok ? "exito" : "aviso"}
          titulo={resultado.ok ? `Enviamos un enlace nuevo a ${nombre}` : "No se envió otro enlace"}
        >
          <p>{resultado.texto}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
