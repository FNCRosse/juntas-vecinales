import type { Metadata } from "next";
import Link from "next/link";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { consultarEnlace } from "@/modulos/identidad/aplicacion/entrarConEnlace";
import { FormularioClaveNueva } from "./FormularioClaveNueva";

export const metadata: Metadata = { title: "Su clave nueva", referrer: "no-referrer" };

// Crear la clave nueva con el enlace del WhatsApp (HU-GAR-25 CA3). Abrir la página no gasta el enlace.
export default async function ClaveNuevaConEnlace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const enlace = await consultarEnlace(token, new Date(), "CLAVE");
  if (enlace.estado !== "VIGENTE") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Este enlace ya no sirve</h1>
        <MensajeEstado tipo="aviso" titulo="Su clave no cambió">
          <p>Cada enlace sirve una sola vez y por 15 minutos. Si pidió otro, solo sirve el último.</p>
        </MensajeEstado>
        <Link
          href="/clave/nueva"
          className="inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace"
        >
          Pedir otro enlace para crear mi clave
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">{enlace.nombre}, escriba su clave nueva</h1>
        <p>La anterior dejará de servir. Le avisaremos del cambio por WhatsApp.</p>
      </div>
      <FormularioClaveNueva token={token} />
    </div>
  );
}
