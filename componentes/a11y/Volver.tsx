import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** "Volver a …" de las pantallas de segundo nivel del prototipo: enlace con flecha, siempre arriba a la izquierda. */
export function Volver({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
    >
      <ChevronLeft aria-hidden className="size-icono" />
      {children}
    </Link>
  );
}
