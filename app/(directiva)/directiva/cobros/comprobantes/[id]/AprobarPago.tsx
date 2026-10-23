"use client";
// @HU-COB-09 @HU-COB-10 @HU-COB-12

import { Check, TriangleAlert, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { soles } from "@/compartido/dinero";
import type { ReciboDto } from "@/modulos/aportes/aplicacion/recibos";
import { ReciboOficial } from "../../recibos/ReciboOficial";

type Resultado = {
  aplicado: boolean;
  nombre: string;
  debeAhora: number;
  alDia: boolean;
  recibo: ReciboDto | null;
};

// DIR-COB-03 y su cierre: aprobar el pago de un comprobante, en dos pasos. Aprobar aplica el abono, avisa a quien pagó y no
// se deshace desde aquí, así que lleva su confirmación (R-12). Va dentro de la página del comprobante, que ya tiene su
// título: por eso la confirmación usa uno de nivel 2.
export function AprobarPago({
  comprobanteId,
  hrefObservar,
  nombre,
  vivienda,
  monto,
  debe,
  medio,
  semanas,
}: {
  comprobanteId: string;
  /** Observar el comprobante es otra pantalla (DIR-COB-05); aquí solo se ofrece junto a «Aprobar». */
  hrefObservar: string;
  nombre: string;
  vivienda: string;
  monto: number;
  debe: number;
  medio: string;
  semanas: string;
}) {
  const [paso, setPaso] = useState<"revisar" | "confirmar" | "aprobado">("revisar");
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  async function aprobar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<Resultado>(`/api/aportes/comprobantes/${comprobanteId}/aprobar`, "PATCH");
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    setResultado(r.datos);
    setPaso("aprobado");
  }

  if (paso === "aprobado" && resultado) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Pago aprobado">
          <p>
            {resultado.alDia
              ? `${resultado.nombre} queda al día.`
              : `${resultado.nombre} todavía debe ${soles(resultado.debeAhora)}.`}
            {resultado.recibo ? ` Emitimos el recibo N.° ${resultado.recibo.numero}.` : ""}
          </p>
        </MensajeEstado>
        {resultado.recibo && <ReciboOficial recibo={resultado.recibo} puedeEnviar />}
        <BotonEnlace href="/directiva/cobros" icono={Wallet}>
          Volver a Cobros
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    const falta = Math.max(0, debe - monto);
    return (
      <PasoConfirmacion
        referencia={titulo}
        nivel={2}
        titulo="¿Desea aprobar este pago?"
        filas={[
          ["Monto", soles(monto)],
          ["Vecino", nombre],
          ["Predio", vivienda],
          ["Medio", medio],
          ["Qué paga", semanas],
        ]}
        efecto={
          falta === 0
            ? `El pago quedará Aprobado, ${nombre} pasará a Al día y le avisaremos.`
            : `El pago quedará Aprobado y le avisaremos a ${nombre}. Todavía deberá ${soles(falta)}.`
        }
        textoConfirmar="Sí, aprobar el pago"
        enviando={enviando}
        error={falla}
        alConfirmar={aprobar}
        alCorregir={() => setPaso("revisar")}
        hrefCancelar="/directiva/cobros"
        textoCancelar="Cancelar, no guardar nada"
      />
    );
  }

  return (
    <div className="flex flex-col gap-opuestas">
      <Boton type="button" icono={Check} anchoCompleto onClick={() => setPaso("confirmar")}>
        Aprobar el pago
      </Boton>
      <BotonEnlace href={hrefObservar} variante="secundario" icono={TriangleAlert}>
        Marcar como observado
      </BotonEnlace>
    </div>
  );
}
