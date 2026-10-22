"use client";
// @HU-COB-12

import { FileDown, Printer, Send } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, clasesBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import type { ReciboDto } from "@/modulos/aportes/aplicacion/recibos";

// DIR-COB-04: el recibo oficial con lo que dice el papel y sus tres salidas: enviarlo a la app de quien pagó, abrirlo para
// imprimir y entregarlo en su casa, o bajar el PDF. Va dentro de una página que ya tiene su título (la del recibo o la
// del pago aprobado). Enviarlo a la app es reversible por la casa (solo aparece en su lista) y no lleva segunda
// confirmación.
export function ReciboOficial({ recibo, puedeEnviar }: { recibo: ReciboDto; puedeEnviar: boolean }) {
  const [enviado, setEnviado] = useState(recibo.enviado);
  const [recienEnviado, setRecienEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ recibo: ReciboDto }>(`/api/aportes/recibos/${recibo.id}/enviar`, "POST");
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    setEnviado(r.datos.recibo.enviado);
    setRecienEnviado(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label={`Recibo oficial N.° ${recibo.numero}`}
        className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      >
        <p className="font-bold">Junta Vecinal de Villa de Fátima</p>
        <p className="text-texto-secundario">Recibo oficial de cuota de vigilancia</p>
        <dl className="flex flex-col gap-3">
          {[
            ["N.°", recibo.numero],
            ["Vecino o vecina", recibo.titular],
            ["Predio", recibo.vivienda],
            ["Fecha", recibo.fecha],
            ["Concepto", recibo.concepto],
            ["Medio de pago", recibo.medio],
            ["Registrado por", recibo.registradoPor],
            ["Código de verificación", recibo.codigo],
            ["Total", soles(recibo.monto)],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>
      {recienEnviado && (
        <MensajeEstado tipo="exito" titulo="Recibo enviado">
          <p>{recibo.titular} lo verá en Mis pagos y recibos, con un botón para confirmar que lo recibió.</p>
        </MensajeEstado>
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió el recibo">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      {enviado && !recienEnviado && (
        <p>
          Enviado a la app de {recibo.titular} el {enviado}.
          {recibo.confirmado ? ` Confirmó que lo recibió el ${recibo.confirmado}.` : ""}
        </p>
      )}
      <div className="flex flex-col gap-opuestas">
        {puedeEnviar && !enviado && (
          <Boton type="button" icono={Send} anchoCompleto cargando={enviando} onClick={enviar}>
            Enviarlo a la app de {recibo.titular}
          </Boton>
        )}
        <a
          href={`/api/aportes/recibos/${recibo.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className={clasesBoton("secundario", true)}
        >
          <Printer aria-hidden className="size-icono shrink-0" />
          <span>
            Ver para imprimir y entregar en su casa<span className="sr-only"> (se abre en otra pestaña)</span>
          </span>
        </a>
        <a
          href={`/api/aportes/recibos/${recibo.id}/pdf?descargar=1`}
          className={clasesBoton("secundario", true)}
        >
          <FileDown aria-hidden className="size-icono shrink-0" />
          <span>Descargar el PDF</span>
        </a>
      </div>
    </div>
  );
}
