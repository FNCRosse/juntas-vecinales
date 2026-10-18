"use client";
// @HU-ASA-14

import { Check, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Dialogo } from "@/componentes/a11y/Dialogo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { MOTIVOS_DE_DESCARTE } from "@/modulos/asambleas/aplicacion/motivosDeDescarte";

// DIR-ASA-05: «Decidir» abre una hoja con «Incluir en la agenda» y «No incluir» (con un motivo breve que se le
// envía al vecino). La decisión se puede cambiar después con «Cambiar la decisión», así que se aplica directa,
// sin paso de confirmación (R-12).
export function DecidirPropuesta({
  propuestaId,
  titulo,
  decidida,
}: {
  propuestaId: string;
  titulo: string;
  decidida: boolean;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [eligiendoMotivo, setEligiendoMotivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function enviar(cuerpo: { decision: "INCLUIR" | "NO_INCLUIR" | "REABRIR"; motivo?: string }) {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/propuestas/${propuestaId}`, "PATCH", cuerpo);
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    setAbierta(false);
    setEligiendoMotivo(false);
    router.refresh();
  }

  const aviso = falla && (
    <MensajeEstado tipo="error" titulo="No se pudo guardar">
      <p>{falla}</p>
    </MensajeEstado>
  );

  if (decidida) {
    return (
      <div className="flex flex-col gap-3">
        {aviso}
        <Boton
          type="button"
          variante="secundario"
          icono={Undo2}
          cargando={enviando}
          onClick={() => enviar({ decision: "REABRIR" })}
        >
          Cambiar la decisión
        </Boton>
      </div>
    );
  }

  return (
    <Dialogo
      variante="hoja"
      titulo={titulo}
      abierto={abierta}
      alCambiar={(valor) => {
        setAbierta(valor);
        if (!valor) setEligiendoMotivo(false);
      }}
      disparador={
        <Boton type="button" variante="secundario">
          Decidir
        </Boton>
      }
    >
      {aviso}
      {eligiendoMotivo ? (
        <div className="flex flex-col gap-3">
          <p className="font-bold">Motivo breve (se lo enviaremos al vecino)</p>
          {MOTIVOS_DE_DESCARTE.map((motivo) => (
            <Boton
              key={motivo}
              type="button"
              variante="secundario"
              cargando={enviando}
              onClick={() => enviar({ decision: "NO_INCLUIR", motivo })}
            >
              {motivo}
            </Boton>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-opuestas">
          <Boton
            type="button"
            icono={Check}
            cargando={enviando}
            onClick={() => enviar({ decision: "INCLUIR" })}
          >
            Incluir en la agenda
          </Boton>
          <Boton type="button" variante="secundario" icono={X} onClick={() => setEligiendoMotivo(true)}>
            No incluir
          </Boton>
        </div>
      )}
    </Dialogo>
  );
}
