"use client";
// @HU-ASA-10

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

// DCF16 «Revisar y publicar el balance»: una sola confirmación (R-12) con lo que verán los vecinos. Publicado, vuelve a las
// cuentas de la actividad, que ya muestran «Balance publicado».
export function PublicarBalanceDeActividad({
  actividadId,
  filas,
}: {
  actividadId: string;
  filas: [string, string][];
}) {
  const router = useRouter();
  const volver = `/directiva/actividades/${actividadId}`;
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const idOperacion = useRef<string>(null);

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/eventos/${actividadId}/balance`, "POST", {
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      router.push(volver);
      return router.refresh();
    }
    setFalla(r.error);
  }

  return (
    <PasoConfirmacion
      paso="Revisar y publicar"
      titulo="¿Desea publicar el balance?"
      filas={filas}
      efecto="Se publicará en Actas y balances y llegará a Avisos de cada vecino. Los vecinos verán concepto y monto de cada gasto, no los comprobantes. Una vez publicado ya no se puede cambiar."
      textoConfirmar="Sí, publicar el balance"
      enviando={enviando}
      error={falla}
      alConfirmar={publicar}
      alCorregir={() => router.push(volver)}
      hrefCancelar={volver}
    />
  );
}
