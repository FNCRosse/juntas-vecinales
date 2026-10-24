import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CobrosGuardados } from "../CobrosGuardados";

export const metadata: Metadata = { title: "Cobros en efectivo guardados" };

// DIR-COB-10 (HU-COB-11 CA2 y CA3): lo que cobró en efectivo y sigue en este teléfono o ya llegó a la junta. La lista sale de
// la cola local, así que se ve igual sin señal; el layout de la directiva ya exige sesión y rol.
export default function Guardados() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cobros
      </Link>
      <h1 className="text-titulo-1">Cobros en efectivo guardados</h1>
      <CobrosGuardados />
    </div>
  );
}
