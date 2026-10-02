"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

/** Gasta el enlace con un POST: solo una persona que pulsa el botón entra (HU-GAR-02 CA1). */
export function BotonEntrar({ token }: { token: string }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    setEnviando(true);
    const resultado = await enviarJson<{ destino: string }>("/api/auth/canjear", "POST", { token });
    if (resultado.ok) {
      window.location.replace(resultado.datos.destino);
      return;
    }
    setEnviando(false);
    setError(resultado.error);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <MensajeEstado tipo="error" titulo="No pudimos hacerle entrar">
          <p>{error}</p>
        </MensajeEstado>
      )}
      <Boton icono={LogIn} anchoCompleto cargando={enviando} onClick={entrar}>
        Entrar a mi cuenta
      </Boton>
    </div>
  );
}
