"use client";
// @HU-GAR-12

import { Download } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

/** Registra el pedido (HU-GAR-12 CA2) y baja el PDF con sus datos. */
export function DescargarCopia() {
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<{ fecha: string; descarga: string } | null>(null);
  const [falla, setFalla] = useState<string | null>(null);

  async function descargar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ fecha: string; descarga: string }>("/api/arco/solicitudes", "POST", {
      tipo: "ACCESO",
    });
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    setLista(r.datos);
    window.location.assign(r.datos.descarga);
  }

  return (
    <div className="flex flex-col gap-3">
      <Boton icono={Download} cargando={enviando} onClick={descargar}>
        Bajar una copia de mis datos (PDF)
      </Boton>
      {lista && (
        <MensajeEstado tipo="exito" titulo="Descargamos una copia de sus datos">
          <p>Registramos su pedido el {lista.fecha}. El archivo solo tiene sus datos.</p>
          <a href={lista.descarga} className="font-bold text-texto-enlace">
            Si no se bajó, bájelo otra vez
          </a>
        </MensajeEstado>
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos preparar su copia">
          <p>{falla}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
