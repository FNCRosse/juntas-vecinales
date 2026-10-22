"use client";
// @HU-COB-12

import { CircleCheck, Printer } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, clasesBoton } from "@/componentes/a11y/Boton";

// DIR-COB-11: «Marcar como entregado» y «Ver para imprimir» de un recibo en papel que pidió una casa. Marcar la entrega
// no mueve dinero ni avisa a nadie, así que se aplica con un solo toque.
export function EntregarRecibo({
  pedidoId,
  reciboId,
  puedeEntregar,
}: {
  pedidoId: string;
  reciboId: string;
  puedeEntregar: boolean;
}) {
  const [entregado, setEntregado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function entregar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/aportes/recibos-en-papel/${pedidoId}/entregar`, "PATCH");
    setEnviando(false);
    if (r.ok) setEntregado(true);
    else setFalla(r.error);
  }

  if (entregado) {
    return (
      <p role="status" className="inline-flex items-center gap-1 font-bold">
        <CircleCheck aria-hidden className="size-icono-pequeno" />
        Recibo marcado como entregado
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-opuestas">
      {falla && <p role="alert">{falla}</p>}
      {puedeEntregar && (
        <Boton type="button" icono={CircleCheck} anchoCompleto cargando={enviando} onClick={entregar}>
          Marcar como entregado
        </Boton>
      )}
      <a
        href={`/api/aportes/recibos/${reciboId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className={clasesBoton("secundario", true)}
      >
        <Printer aria-hidden className="size-icono shrink-0" />
        <span>
          Ver para imprimir<span className="sr-only"> (se abre en otra pestaña)</span>
        </span>
      </a>
    </div>
  );
}
