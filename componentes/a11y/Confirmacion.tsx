"use client";
// @HU-ACC-03

import { useState, type ReactNode } from "react";
import { Boton } from "./Boton";
import { CerrarDialogo, Dialogo } from "./Dialogo";

// RetroalimentacionNoPunitiva (HU-ACC-03, WCAG 3.3.4): antes de consumar una acción crítica
// (dinero, voto, queja, bajas) muestra qué se hará y con qué datos, con Confirmar y Cancelar.
// Cancelar solo cierra: lo que la persona ya escribió sigue en el formulario (CA3).

export type FilaResumen = { etiqueta: string; valor: string };

export function Confirmacion({
  disparador,
  titulo,
  resumen,
  aviso,
  textoConfirmar,
  alConfirmar,
  peligro = false,
}: {
  disparador: ReactNode;
  titulo: string;
  resumen: FilaResumen[];
  /** Qué pasará después, en lenguaje llano. */
  aviso?: string;
  /** Verbo y objeto: "Enviar mi comprobante", nunca "Aceptar". */
  textoConfirmar: string;
  alConfirmar: () => void | Promise<void>;
  /** Acción destructiva o irreversible: el botón usa la variante de peligro. */
  peligro?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    try {
      await alConfirmar();
      setAbierto(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialogo disparador={disparador} titulo={titulo} variante="hoja" abierto={abierto} alCambiar={setAbierto}>
      <dl className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4">
        {resumen.map(({ etiqueta, valor }) => (
          <div key={etiqueta} className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
            <dd className="font-bold">{valor}</dd>
          </div>
        ))}
      </dl>
      {aviso && <p>{aviso}</p>}
      <div className="flex flex-col gap-separacion">
        <Boton
          variante={peligro ? "peligro" : "primario"}
          anchoCompleto
          cargando={enviando}
          onClick={confirmar}
        >
          {textoConfirmar}
        </Boton>
        <CerrarDialogo asChild>
          <Boton variante="secundario" anchoCompleto>
            Cancelar
          </Boton>
        </CerrarDialogo>
      </div>
    </Dialogo>
  );
}
