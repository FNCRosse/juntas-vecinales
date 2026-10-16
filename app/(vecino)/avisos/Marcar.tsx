"use client";
// @HU-GAR-20 @HU-ACC-03

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Marcar como leído es reversible (R-12): se aplica al instante y "Listo." con "Deshacer" lo devuelve a
// "sin leer". El aviso vive en el proveedor porque el botón de un aviso ya leído desaparece al releer.

type Hecho = { ids: string[]; texto: string };
type Lectura = {
  hecho: Hecho | null;
  error: string | null;
  registrar: (hecho: Hecho) => void;
  deshacer: () => void;
  cerrar: () => void;
};
const ContextoLectura = createContext<Lectura | null>(null);
const useLectura = () => useContext(ContextoLectura)!;

export function ProveedorLectura({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [hecho, setHecho] = useState<Hecho | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deshacer() {
    if (!hecho) return;
    const r = await enviarJson("/api/notificaciones/no-leidas", "POST", { ids: hecho.ids });
    if (r.ok) {
      setHecho(null);
      router.refresh();
    } else {
      setError(r.error);
    }
  }

  const registrar = (nuevo: Hecho) => {
    setError(null);
    setHecho(nuevo);
  };
  return (
    <ContextoLectura.Provider value={{ hecho, error, registrar, deshacer, cerrar: () => setHecho(null) }}>
      {children}
    </ContextoLectura.Provider>
  );
}

/** "Listo." con "Deshacer" tras marcar como leído. */
export function AvisoDeLectura() {
  const { hecho, error, deshacer, cerrar } = useLectura();
  return (
    <>
      {hecho && <AvisoDeshacer texto={hecho.texto} alDeshacer={deshacer} alCerrar={cerrar} />}
      {error && (
        <MensajeEstado tipo="error" titulo="No se pudo deshacer">
          <p>{error}</p>
        </MensajeEstado>
      )}
    </>
  );
}

/** Marcar como leído y volver a leer la página: el contador baja al momento (HU-GAR-20 CA3). */
export function MarcarLeido({ id, titulo }: { id: string; titulo: string }) {
  const router = useRouter();
  const { registrar } = useLectura();
  const [enviando, setEnviando] = useState(false);
  return (
    <Boton
      variante="secundario"
      icono={Check}
      className="self-start"
      cargando={enviando}
      onClick={async () => {
        setEnviando(true);
        const r = await enviarJson("/api/notificaciones/" + id, "PATCH");
        if (r.ok) registrar({ ids: [id], texto: `«${titulo}» quedó como leído.` });
        router.refresh();
      }}
    >
      Marcar como leído<span className="sr-only">: {titulo}</span>
    </Boton>
  );
}

export function MarcarTodos() {
  const router = useRouter();
  const { registrar } = useLectura();
  const [enviando, setEnviando] = useState(false);
  return (
    <Boton
      variante="secundario"
      cargando={enviando}
      onClick={async () => {
        setEnviando(true);
        const r = await enviarJson<{ ids: string[] }>("/api/notificaciones/leidas", "POST");
        setEnviando(false);
        if (r.ok && r.datos.ids.length)
          registrar({ ids: r.datos.ids, texto: "Todos sus avisos quedaron como leídos." });
        router.refresh();
      }}
    >
      Marcar todos como leídos
    </Boton>
  );
}
