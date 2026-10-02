"use client";
// @HU-GAR-07 @HU-GAR-08

import { Check, DoorOpen, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, type VarianteBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

const ICONOS = { puerta: DoorOpen, si: Check, no: X, salida: LogOut };

/** Un botón de la garita que envía una acción y luego va a otra pantalla o refresca la actual. */
export function AccionGarita({
  ruta,
  metodo = "POST",
  cuerpo,
  icono,
  variante,
  destino,
  children,
}: {
  ruta: string;
  metodo?: "POST" | "PATCH";
  cuerpo: unknown;
  icono?: keyof typeof ICONOS;
  variante?: VarianteBoton;
  /** Adónde ir al terminar; sin destino, se refresca la pantalla. */
  destino?: string;
  children: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(ruta, metodo, cuerpo);
    if (r.ok) {
      if (destino) return router.push(destino);
      router.refresh();
    } else setFalla(r.error);
    setEnviando(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <Boton
        variante={variante}
        icono={icono ? ICONOS[icono] : undefined}
        cargando={enviando}
        onClick={enviar}
      >
        {children}
      </Boton>
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo anotar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
    </div>
  );
}
