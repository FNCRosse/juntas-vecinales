"use client";

import { LogIn } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

/**
 * Gasta el enlace con un POST (HU-GAR-02 CA1): la página lo envía sola al abrirse en el navegador.
 * Las vistas previas de WhatsApp no corren el script, así que no lo gastan. Si el script no corre,
 * el botón envía el formulario igual.
 */
/** Canjea el enlace y entra; si no se pudo, devuelve el mensaje para la persona. */
async function canjear(token: string): Promise<string | null> {
  const resultado = await enviarJson<{ destino: string }>("/api/auth/canjear", "POST", { token });
  if (!resultado.ok) return resultado.error;
  window.location.replace(resultado.datos.destino);
  return null;
}

export function BotonEntrar({ token }: { token: string }) {
  // Sin script, el botón dice "Entrar a mi cuenta" y envía el formulario (nunca "Enviando…").
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);

  useEffect(() => {
    if (enCurso.current) return;
    enCurso.current = true;
    canjear(token).then((mensaje) => {
      enCurso.current = false;
      if (mensaje) setError(mensaje);
    });
  }, [token]);

  function entrar(evento: FormEvent) {
    evento.preventDefault();
    if (enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    canjear(token).then((mensaje) => {
      enCurso.current = false;
      setEnviando(false);
      setError(mensaje);
    });
  }

  return (
    <form method="post" action="/api/auth/canjear" onSubmit={entrar} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {error && (
        <MensajeEstado tipo="error" titulo="No pudimos hacerle entrar">
          <p>{error}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={LogIn} anchoCompleto cargando={enviando}>
        Entrar a mi cuenta
      </Boton>
    </form>
  );
}
