"use client";

import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeDeCampo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Opcion } from "@/componentes/a11y/Opcion";

const ID = "campo-acepto";

export function FormularioPolitica() {
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aceptar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ destino: string }>("/api/auth/politica", "POST", { acepto });
    if (r.ok) {
      window.location.assign(r.datos.destino);
      return;
    }
    setEnviando(false);
    if (r.estado === 400) {
      setError(r.campos.acepto ?? r.error);
      document.getElementById(ID)?.focus();
    } else setFalla(r.error);
  }

  return (
    <form noValidate onSubmit={aceptar} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Opcion
          tipo="checkbox"
          id={ID}
          etiqueta="Leí y acepto la política de privacidad"
          checked={acepto}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${ID}-error` : undefined}
          onChange={(e) => {
            setAcepto(e.target.checked);
            if (e.target.checked) setError(null);
          }}
        />
        {error && <MensajeDeCampo id={`${ID}-error`}>{error}</MensajeDeCampo>}
      </div>
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos guardar su respuesta">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" anchoCompleto cargando={enviando}>
        Aceptar y continuar
      </Boton>
    </form>
  );
}
