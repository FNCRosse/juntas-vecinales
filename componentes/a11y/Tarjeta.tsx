import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Tarjetas y filas del prototipo (C-05, guía visual §5.5). Las pulsables son un solo enlace con un solo
// destino: no hay objetivos anidados (HU-ACC-09).

const SUPERFICIE = "rounded-tarjeta bg-fondo-superficie shadow-tarjeta";
const PULSABLE = "text-texto-principal no-underline hover:border-borde-fuerte active:bg-fondo-suave";

/** Ícono a la izquierda de un título o de una fila, en el color de la acción principal. */
function IconoDeTitulo({ icono: Icono }: { icono: LucideIcon }) {
  return <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />;
}

export function Tarjeta({
  titulo,
  icono,
  nivel = 2,
  destacada = false,
  children,
}: {
  titulo?: string;
  icono?: LucideIcon;
  /** Nivel del título dentro de la página: los encabezados van en orden (WCAG 1.3.1). */
  nivel?: 2 | 3;
  /** La tarjeta principal de la pantalla (lo que debe, lo que se confirma) lleva el borde fuerte. */
  destacada?: boolean;
  children: ReactNode;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  const borde = destacada
    ? "border-(length:--borde-ancho-control) border-borde-fuerte"
    : "border border-borde-sutil";
  return (
    <section className={`flex flex-col gap-3 p-4 senior:p-6 ${SUPERFICIE} ${borde}`}>
      {titulo && (
        <div className="flex items-center gap-2">
          {icono && <IconoDeTitulo icono={icono} />}
          <Titulo className="text-titulo-3">{titulo}</Titulo>
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Tarjeta pulsable (C-05): título con ícono, un dato grande, el detalle y, al pie, "Ver …" con su flecha.
 * Toda la tarjeta es el enlace.
 */
export function TarjetaPulsable({
  href,
  icono,
  titulo,
  dato,
  accion,
  children,
}: {
  href: string;
  icono: LucideIcon;
  titulo: string;
  /** El dato que se lee primero: una fecha, "1 abierto". */
  dato?: string;
  /** Texto del pie: "Ver la asamblea". */
  accion: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 border border-borde-sutil p-4 senior:p-6 ${SUPERFICIE} ${PULSABLE}`}
    >
      <span className="flex items-center gap-2 text-titulo-3 font-bold leading-titulo">
        <IconoDeTitulo icono={icono} />
        {titulo}
      </span>
      {dato && <span className="text-titulo-2 font-bold leading-titulo">{dato}</span>}
      {children}
      <span className="flex items-center gap-1 font-bold text-texto-enlace underline underline-offset-4">
        {accion}
        <ChevronRight aria-hidden className="size-icono shrink-0" />
      </span>
    </Link>
  );
}

/**
 * Fila pulsable (C-05): ícono, texto en negrita y flecha, de 64 px de alto. La variante "suave" (pantallas
 * de entrada) lleva el ícono en un círculo sobre el fondo arena.
 */
export function FilaEnlace({
  href,
  icono,
  titulo,
  detalle,
  extra,
  variante = "superficie",
}: {
  href: string;
  icono: LucideIcon;
  titulo: string;
  /** Línea bajo el título; texto chico y secundario si es un texto, o lo que se pase ("Delegado a …"). */
  detalle?: ReactNode;
  /** Lo que va antes de la flecha, como la insignia de "2 nuevos". */
  extra?: ReactNode;
  variante?: "superficie" | "suave";
}) {
  const Icono = icono;
  const suave = variante === "suave";
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center gap-3 border border-borde-sutil py-2 ${PULSABLE} ${
        suave
          ? "rounded-control bg-fondo-suave px-3 hover:bg-fondo-superficie"
          : `px-4 senior:px-6 ${SUPERFICIE}`
      }`}
    >
      {suave ? (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-pastilla border border-borde-sutil bg-fondo-superficie text-accion-primaria">
          <Icono aria-hidden className="size-icono" />
        </span>
      ) : (
        <IconoDeTitulo icono={icono} />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <strong>{titulo}</strong>
        {typeof detalle === "string" ? (
          <span className="text-pequeno text-texto-secundario">{detalle}</span>
        ) : (
          detalle
        )}
      </span>
      {extra}
      <ChevronRight
        aria-hidden
        className={suave ? "size-icono-pequeno shrink-0 text-texto-secundario" : "size-icono shrink-0"}
      />
    </Link>
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
      className={`flex flex-col gap-3 border border-borde-sutil p-4 senior:p-6 ${SUPERFICIE} ${PULSABLE}`}
    >
      <span className="text-titulo-3 font-bold leading-titulo text-texto-enlace underline underline-offset-4">
        {titulo}
      </span>
      {children}
    </Link>
  );
}
