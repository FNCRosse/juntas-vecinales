import { ChevronLeft, KeyRound, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";

// Enlaces de las pantallas de entrada (prototipo VEC-ACC-01, 04, 05 y 07): volver y las opciones
// alternas, cada una con un solo destino y toda la fila pulsable (HU-ACC-09).

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

/** "¿El enlace no funciona o ya venció?": las dos salidas de la entrada del vecino, bajo una línea. */
export function OtrasFormasDeEntrar() {
  return (
    <section
      aria-labelledby="otras-formas"
      className="flex flex-col gap-separacion border-t border-borde-sutil pt-4"
    >
      <h2 id="otras-formas" className="text-base font-bold">
        ¿El enlace no funciona o ya venció?
      </h2>
      <FilaEnlace
        href="/entrar/enlace-nuevo"
        icono={MessageCircleMore}
        titulo="Pedir un enlace nuevo"
        detalle="Se lo enviamos por WhatsApp"
        variante="suave"
      />
      <FilaEnlace
        href="/clave"
        icono={KeyRound}
        titulo="Entrar con mi clave de respaldo"
        detalle="Si ya creó una clave"
        variante="suave"
      />
    </section>
  );
}
