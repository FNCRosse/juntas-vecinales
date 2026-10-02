import { ChevronLeft, ChevronRight, KeyRound, MessageCircleMore } from "lucide-react";
import Link from "next/link";

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

const ICONOS = { enlace: MessageCircleMore, clave: KeyRound };

export function OpcionEntrada({
  href,
  icono,
  titulo,
  detalle,
}: {
  href: string;
  icono: keyof typeof ICONOS;
  titulo: string;
  detalle: string;
}) {
  const Icono = ICONOS[icono];
  return (
    <Link
      href={href}
      className="flex min-h-tactil items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 text-texto-principal no-underline hover:border-borde-fuerte"
    >
      <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
      <span className="flex flex-1 flex-col">
        <strong>{titulo}</strong>
        <span className="text-pequeno text-texto-secundario">{detalle}</span>
      </span>
      <ChevronRight aria-hidden className="size-icono-pequeno shrink-0" />
    </Link>
  );
}

/** "¿El enlace no funciona o ya venció?": las dos salidas de la entrada del vecino. */
export function OtrasFormasDeEntrar() {
  return (
    <section aria-labelledby="otras-formas" className="flex flex-col gap-3">
      <h2 id="otras-formas" className="text-base font-bold text-texto-secundario">
        ¿El enlace no funciona o ya venció?
      </h2>
      <OpcionEntrada
        href="/entrar/enlace-nuevo"
        icono="enlace"
        titulo="Pedir un enlace nuevo"
        detalle="Se lo enviamos por WhatsApp"
      />
      <OpcionEntrada
        href="/clave"
        icono="clave"
        titulo="Entrar con mi clave de respaldo"
        detalle="Si ya creó una clave"
      />
    </section>
  );
}
