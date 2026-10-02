"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { CampoClave } from "@/componentes/a11y/CampoClave";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

export function FormularioClave({ dni }: { dni: string }) {
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const clave = String(new FormData(evento.currentTarget).get("clave") ?? "");
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ destino: string }>("/api/auth/clave-respaldo", "POST", { clave });
    if (r.ok) {
      window.location.assign(r.datos.destino);
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
      {/* El DNI ya lo tenemos (WCAG 3.3.7). El campo oculto es para que el gestor de contraseñas
          guarde la clave con el DNI completo como usuario. */}
      <input type="text" name="usuario" autoComplete="username" value={dni} readOnly hidden />
      <Campo
        name="dni"
        etiqueta="Su DNI"
        ayuda="Ya lo tenemos. No necesita escribirlo."
        value={`DNI terminado en ${dni.slice(-2)}`}
        readOnly
        autoComplete="off"
      />
      <CampoClave
        name="clave"
        etiqueta="Su clave nueva"
        ayuda="Al menos 6 números o letras. Su teléfono puede guardarla por usted."
        autoComplete="new-password"
        error={error}
      />
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos crear su clave">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        <Boton type="submit" icono={KeyRound} anchoCompleto cargando={enviando}>
          Crear mi clave
        </Boton>
        <Link
          href="/"
          className="inline-flex min-h-tactil items-center justify-center font-bold text-texto-enlace"
        >
          Ahora no, seguir sin clave
        </Link>
      </div>
    </form>
  );
}
