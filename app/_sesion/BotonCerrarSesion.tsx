"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, clasesBotonBarra } from "@/componentes/a11y/Boton";

/**
 * Cierra la sesión de este dispositivo y vuelve a la entrada. `enBarra`: con el aspecto de «Vista grande» y
 * «Pedir ayuda», para ir en la misma fila de la cabecera (VIG-20).
 */
export function BotonCerrarSesion({ destino, enBarra = false }: { destino: string; enBarra?: boolean }) {
  const [enviando, setEnviando] = useState(false);
  async function salir() {
    setEnviando(true);
    await enviarJson("/api/auth/sesion", "DELETE");
    window.location.assign(destino);
  }
  if (enBarra) {
    return (
      <button
        type="button"
        onClick={salir}
        disabled={enviando}
        aria-busy={enviando}
        className={clasesBotonBarra()}
      >
        <LogOut aria-hidden className="size-icono shrink-0" />
        <span>Cerrar sesión</span>
      </button>
    );
  }
  return (
    <Boton variante="secundario" icono={LogOut} compacto cargando={enviando} onClick={salir}>
      Cerrar sesión
    </Boton>
  );
}
