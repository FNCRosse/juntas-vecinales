"use client";
// @HU-ASA-07

import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// «Validar el poder» (DIR-ASA-09): la mesa comprueba el DNI del apoderado en la puerta y lo valida; desde ahí
// la casa del titular cuenta para el quórum. Es un registro del día, así que va directo (R-12).
export function ValidarPoder({ asambleaId, delegacionId }: { asambleaId: string; delegacionId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function validar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/checkin/poder`, "POST", { delegacionId });
    setEnviando(false);
    if (r.ok) router.refresh();
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="aviso" titulo="No se pudo validar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="button" icono={BadgeCheck} cargando={enviando} onClick={validar}>
        Validar el poder
      </Boton>
    </div>
  );
}
