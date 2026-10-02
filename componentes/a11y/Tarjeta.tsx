import Link from "next/link";
import type { ReactNode } from "react";

// Tarjeta de la guía visual §5.5. La pulsable es un solo enlace con un solo destino: no hay
// objetivos anidados (HU-ACC-09).

const BASE =
  "flex flex-col gap-3 p-4 senior:p-6 rounded-tarjeta border border-borde-sutil bg-fondo-superficie shadow-tarjeta";

export function Tarjeta({
  titulo,
  nivel = 2,
  children,
}: {
  titulo?: string;
  /** Nivel del título dentro de la página: los encabezados van en orden (WCAG 1.3.1). */
  nivel?: 2 | 3;
  children: ReactNode;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <section className={BASE}>
      {titulo && <Titulo className="text-titulo-3">{titulo}</Titulo>}
      {children}
    </section>
  );
}

export function TarjetaEnlace({
  href,
  titulo,
  children,
}: {
  href: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${BASE} text-texto-principal no-underline hover:border-borde-fuerte active:bg-fondo-suave`}
    >
      <span className="text-titulo-3 font-bold leading-titulo text-texto-enlace underline underline-offset-4">
        {titulo}
      </span>
      {children}
    </Link>
  );
}
