"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";

/** Cierra la sesión de este dispositivo y vuelve a la entrada. */
export function BotonCerrarSesion({ destino }: { destino: string }) {
  const [enviando, setEnviando] = useState(false);
  return (
    <Boton
      variante="secundario"
      icono={LogOut}
      anchoCompleto
      cargando={enviando}
      onClick={async () => {
        setEnviando(true);
        await enviarJson("/api/auth/sesion", "DELETE");
        window.location.assign(destino);
      }}
    >
      Cerrar sesión
    </Boton>
  );
}
