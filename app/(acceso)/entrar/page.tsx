import { MessageCircleMore } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Entrar" };

// Entrada del vecino sin enlace. Pedir un enlace nuevo (HU-GAR-11) y entrar con la clave de
// respaldo (HU-GAR-24) se suman aquí con sus HU.
export default function Entrar() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Entrar a su cuenta</h1>
      <div className="flex items-start gap-3">
        <MessageCircleMore aria-hidden className="size-icono shrink-0 text-accion-primaria" />
        <p>Para entrar, abra el enlace que le enviamos por WhatsApp. No necesita clave.</p>
      </div>
      <p>Si no lo tiene o ya no sirve, pida uno nuevo a la administración de la junta.</p>
      <Link
        href="/entrar/equipo"
        className="inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace"
      >
        Soy parte del equipo: entrar con mi clave
      </Link>
    </div>
  );
}
