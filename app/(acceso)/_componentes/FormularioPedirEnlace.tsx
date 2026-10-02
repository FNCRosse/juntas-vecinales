"use client";

import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Pedir un enlace por WhatsApp con el DNI o la casa: de entrada (VEC-ACC-04, HU-GAR-11) o para
// crear una clave nueva (VEC-ACC-07, HU-GAR-25). Solo se envía al WhatsApp del padrón (R-01).

export function FormularioPedirEnlace({
  ruta,
  textoBoton,
  tituloEnviado,
  textoEnviado,
}: {
  ruta: string;
  textoBoton: string;
  tituloEnviado: string;
  /** Recibe los tres últimos números del WhatsApp. */
  textoEnviado: string;
}) {
  const [error, setError] = useState<string | undefined>();
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminadoEn, setTerminadoEn] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const identificador = String(new FormData(evento.currentTarget).get("identificador") ?? "");
    setEnviando(true);
    setError(undefined);
    setAviso(null);
    const r = await enviarJson<{ telefonoTerminadoEn: string }>(ruta, "POST", { identificador });
    setEnviando(false);
    if (r.ok) return setTerminadoEn(r.datos.telefonoTerminadoEn);
    setTerminadoEn(null);
    if (r.estado === 400 || r.estado === 404) {
      setError(r.campos.identificador ?? r.error);
      document.getElementById("campo-identificador")?.focus();
    } else setAviso(r.error);
  }

  return (
    <form noValidate onSubmit={pedir} className="flex flex-col gap-6">
      {terminadoEn && (
        <MensajeEstado tipo="exito" titulo={tituloEnviado}>
          <p>{textoEnviado.replace("{terminado}", terminadoEn)}</p>
        </MensajeEstado>
      )}
      {aviso && (
        <MensajeEstado tipo="aviso" titulo="Todavía no le enviamos otro">
          <p>{aviso}</p>
        </MensajeEstado>
      )}
      <Campo
        name="identificador"
        etiqueta="Su DNI o el número de su casa"
        ayuda="Por ejemplo: 08123478 o Mz. C lote 7. Solo lo enviamos al número que figura en el padrón."
        autoComplete="off"
        error={error}
      />
      <Boton type="submit" icono={Send} anchoCompleto cargando={enviando}>
        {textoBoton}
      </Boton>
    </form>
  );
}
