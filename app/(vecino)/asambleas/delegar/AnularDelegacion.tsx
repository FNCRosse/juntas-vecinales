"use client";
// @HU-ASA-06

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Anular la delegación es reversible hasta el plazo (el voto vuelve a ser del titular y puede delegar de
// nuevo), así que es una acción directa, sin paso de confirmación (R-12).
export function AnularDelegacion({ asambleaId }: { asambleaId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function anular() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/delegaciones`, "DELETE");
    setEnviando(false);
    if (r.ok) router.refresh();
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo anular">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="button" variante="secundario" icono={Undo2} cargando={enviando} onClick={anular}>
        Anular la delegación
      </Boton>
    </div>
  );
}
