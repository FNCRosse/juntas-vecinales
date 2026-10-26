"use client";
// @HU-COB-14

import { Users } from "lucide-react";
import { useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { soles } from "@/compartido/dinero";

// DIR-TRA-02: publicar la rendición de cuentas del mes. Es una acción que no se deshace (queda inalterable), así que lleva su
// confirmación (R-12); los vecinos solo verán totales.
export function PublicarRendicion({
  mes,
  etiqueta,
  ingresos,
  gastos,
  saldo,
  comprobantes,
}: {
  mes: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
  saldo: number;
  comprobantes: number;
}) {
  const [publicada, setPublicada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  // Un identificador por publicación: si se reintenta por una falla de red, no se publica dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/transparencia/rendiciones", "POST", {
      mes,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) setPublicada(true);
    else setFalla(r.error);
  }

  if (publicada) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Rendición publicada">
          <p>Los vecinos ya ven los gastos de {etiqueta.toLowerCase()} en Cuentas del barrio.</p>
        </MensajeEstado>
        <BotonEnlace href={`/directiva/cuentas?mes=${mes}`} icono={Users}>
          Volver a la rendición
        </BotonEnlace>
      </div>
    );
  }
  return (
    <PasoConfirmacion
      referencia={titulo}
      titulo="¿Desea publicar la rendición de cuentas?"
      filas={[
        ["Mes", etiqueta],
        ["Ingresos", soles(ingresos)],
        ["Gastos", soles(gastos)],
        ["Saldo", soles(saldo)],
        ["Comprobantes", comprobantes === 1 ? "1 adjunto" : `${comprobantes} adjuntos`],
      ]}
      efecto="Los vecinos la verán en Cuentas del barrio, solo con totales. Después de publicarla no se puede modificar."
      textoConfirmar="Sí, publicar"
      enviando={enviando}
      error={falla}
      alConfirmar={publicar}
      alCorregir={() => history.back()}
      hrefCancelar={`/directiva/cuentas?mes=${mes}`}
    />
  );
}
