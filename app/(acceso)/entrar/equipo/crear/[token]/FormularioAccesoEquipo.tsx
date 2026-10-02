"use client";

import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { CampoClave } from "@/componentes/a11y/CampoClave";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

export function FormularioAccesoEquipo({ token, dni }: { token: string; dni: string }) {
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const clave = String(new FormData(evento.currentTarget).get("clave") ?? "");
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ destino: string }>("/api/auth/equipo/crear", "POST", { token, clave });
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
    <form noValidate onSubmit={crear} className="flex flex-col gap-6">
      {/* Su usuario es su DNI: ya lo tenemos (WCAG 3.3.7) y el gestor de contraseñas lo guarda. */}
      <Campo
        name="dni"
        etiqueta="Usuario: su DNI"
        ayuda="Ya lo tenemos. No necesita escribirlo."
        value={dni}
        readOnly
        autoComplete="username"
      />
      <CampoClave
        name="clave"
        etiqueta="Clave nueva"
        ayuda="Mínimo 12 caracteres. Puede usar la que le sugiera su teléfono o pegarla desde su gestor."
        autoComplete="new-password"
        error={error}
      />
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos crear su acceso">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={Check} anchoCompleto cargando={enviando}>
        Crear mi acceso
      </Boton>
    </form>
  );
}
