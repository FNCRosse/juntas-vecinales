"use client";

import { KeyRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { CampoClave } from "@/componentes/a11y/CampoClave";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

export function FormularioClaveNueva({ token }: { token: string }) {
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const clave = String(new FormData(evento.currentTarget).get("clave") ?? "");
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ destino: string }>("/api/auth/clave/restablecer/confirmar", "POST", {
      token,
      clave,
    });
    if (r.ok) {
      window.location.replace(r.datos.destino);
      return;
    }
    setEnviando(false);
    if (r.estado === 400) {
      setError(r.campos.clave ?? r.error);
      document.getElementById("campo-clave")?.focus();
    } else setFalla(r.error);
  }

  return (
    <form noValidate onSubmit={guardar} className="flex flex-col gap-6">
      <CampoClave
        name="clave"
        etiqueta="Su clave nueva"
        ayuda="Al menos 6 números o letras. Su teléfono puede guardarla por usted."
        autoComplete="new-password"
        error={error}
      />
      {falla && (
        <MensajeEstado tipo="error" titulo="Su clave no cambió">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={KeyRound} anchoCompleto cargando={enviando}>
        Guardar mi clave nueva
      </Boton>
    </form>
  );
}
