"use client";
// @HU-ASA-07

import { Vote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// «Abrir las votaciones» (DIR-ASA-09). Sin quórum definitivo el servidor lo rechaza y el mensaje dice cuánto
// falta, como el aviso del prototipo («Todavía no se puede votar»).
export function AbrirVotaciones({ asambleaId }: { asambleaId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function abrir() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/votaciones`, "POST");
    setEnviando(false);
    if (r.ok) router.refresh();
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="aviso" titulo="Votaciones bloqueadas">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="button" icono={Vote} cargando={enviando} onClick={abrir}>
        Abrir las votaciones
      </Boton>
    </div>
  );
}
