import { MessageCircleMore } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { OtrasFormasDeEntrar } from "../_componentes/Opciones";

export const metadata: Metadata = { title: "Entrar" };

// Entrada del vecino sin enlace: pedir uno nuevo (HU-GAR-11) o entrar con la clave de respaldo
// (HU-GAR-24 CA1).
export default function Entrar() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Entrar a su cuenta</h1>
      <div className="flex items-start gap-3">
        <MessageCircleMore aria-hidden className="size-icono shrink-0 text-accion-primaria" />
        <p>Para entrar, abra el enlace que le enviamos por WhatsApp. No necesita clave.</p>
      </div>
      <OtrasFormasDeEntrar />
      <Link
        href="/entrar/equipo"
        className="inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace"
      >
        Soy parte del equipo: entrar con mi clave
      </Link>
    </div>
  );
}
