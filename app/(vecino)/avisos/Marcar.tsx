"use client";
// @HU-GAR-20

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";

/** Marcar como leído y volver a leer la página: el contador baja al momento (HU-GAR-20 CA3). */
export function MarcarLeido({ id, titulo }: { id: string; titulo: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  return (
    <Boton
      variante="secundario"
      icono={Check}
      className="self-start"
      cargando={enviando}
      onClick={async () => {
        setEnviando(true);
        await enviarJson(`/api/notificaciones/${id}`, "PATCH");
        router.refresh();
      }}
    >
      Marcar como leído<span className="sr-only">: {titulo}</span>
    </Boton>
  );
}

export function MarcarTodos() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  return (
    <Boton
      variante="secundario"
      cargando={enviando}
      onClick={async () => {
        setEnviando(true);
        await enviarJson("/api/notificaciones/leidas", "POST");
        setEnviando(false);
        router.refresh();
      }}
    >
      Marcar todos como leídos
    </Boton>
  );
}
