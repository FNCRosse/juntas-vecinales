"use client";

import { LogIn } from "lucide-react";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { CampoClave } from "@/componentes/a11y/CampoClave";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

type Errores = { dni?: string; clave?: string; general?: string; pausa?: string };

export function FormularioEquipo() {
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    setEnviando(true);
    const resultado = await enviarJson<{ destino: string }>("/api/auth/clave", "POST", {
      dni: String(datos.get("dni") ?? ""),
      clave: String(datos.get("clave") ?? ""),
    });
    if (resultado.ok) {
      window.location.assign(resultado.datos.destino);
      return;
    }
    setEnviando(false);
    if (resultado.estado === 429) setErrores({ pausa: resultado.error });
    else if (resultado.estado === 400) setErrores(resultado.campos);
    else setErrores({ clave: resultado.error });
  }

  return (
    <form noValidate onSubmit={entrar} className="flex flex-col gap-6">
      {errores.pausa && (
        <MensajeEstado tipo="aviso" titulo="Su cuenta está bien">
          <p>{errores.pausa}</p>
          <p>Si no recuerda la clave, pida una nueva a la administración.</p>
        </MensajeEstado>
      )}
      <Campo
        name="dni"
        etiqueta="Su DNI"
        ayuda="Son 8 números."
        inputMode="numeric"
        autoComplete="username"
        error={errores.dni}
      />
      <CampoClave
        name="clave"
        etiqueta="Clave de equipo"
        ayuda="Puede pegarla o dejar que su gestor de contraseñas la complete."
        autoComplete="current-password"
        error={errores.clave}
      />
      <Boton type="submit" icono={LogIn} anchoCompleto cargando={enviando}>
        Entrar con mi clave
      </Boton>
    </form>
  );
}
