"use client";
// @HU-ACC-04

import { Check, Hand } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

export function CambiarEstado({ id, estado, quien }: { id: string; estado: string; quien: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function pasarA(nuevo: "EN_ATENCION" | "ATENDIDA") {
    setEnviando(true);
    const r = await enviarJson(`/api/accesibilidad/mediacion/${id}`, "PATCH", { estado: nuevo });
    setEnviando(false);
    if (r.ok) router.refresh();
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-separacion md:flex-row">
        {estado === "PENDIENTE" && (
          <Boton variante="secundario" icono={Hand} cargando={enviando} onClick={() => pasarA("EN_ATENCION")}>
            Lo atiendo yo<span className="sr-only">: {quien}</span>
          </Boton>
        )}
        <Boton variante="secundario" icono={Check} cargando={enviando} onClick={() => pasarA("ATENDIDA")}>
          Marcar como atendido<span className="sr-only">: {quien}</span>
        </Boton>
      </div>
      {falla && (
        <MensajeEstado tipo="error" titulo="No cambió el estado">
          <p>{falla}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
