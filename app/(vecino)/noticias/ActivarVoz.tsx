"use client";
// @HU-ACC-02

import { Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { RUTA_PERFIL } from "@/componentes/a11y/modo";

// VEC-TRA-04: mientras la lectura en voz alta está apagada, la pantalla ofrece activarla con un solo botón
// (el interruptor con "Deshacer" sigue en Ayuda y accesibilidad). Al activarla aparece "Escuchar" en cada noticia.
export function ActivarVoz() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function activar() {
    setEnviando(true);
    setError(null);
    const r = await enviarJson(RUTA_PERFIL, "PUT", { sintesisVozActiva: true });
    setEnviando(false);
    if (r.ok) router.refresh();
    else setError(r.error);
  }

  return (
    <div className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6">
      <p>¿Prefiere escuchar las noticias? Puede activar la lectura en voz alta.</p>
      <Boton variante="secundario" icono={Volume2} cargando={enviando} onClick={activar}>
        Activar lectura en voz alta
      </Boton>
      {error && (
        <MensajeEstado tipo="error" titulo="No pudimos guardar su preferencia">
          <p>{error}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
