import { ChevronRight, Clock, type LucideIcon, MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Tarjeta de cobro del prototipo (C-05, DCO01 a DCO04): ícono en un recuadro, el tipo en el color de la acción, el nombre,
// la casa, un dato, la fecha y, a la derecha, el monto y el estado. La acción va al pie, a la derecha, como enlace con
// flecha; lo que no es un enlace (entregar el recibo) entra como `children`.

export function TarjetaDeCobro({
  icono: Icono,
  tipo,
  titulo,
  casa,
  dato,
  fecha,
  monto,
  estado,
  accion,
  nivel = 2,
  children,
}: {
  icono: LucideIcon;
  tipo: string;
  titulo: string;
  casa: string;
  dato?: { icono: LucideIcon; texto: string };
  fecha: string;
  monto?: string;
  estado: ReactNode;
  accion?: { href: string; texto: string };
  /** Nivel del nombre dentro de la página: h3 si la tarjeta está bajo el título de una sección. */
  nivel?: 2 | 3;
  children?: ReactNode;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article className="flex flex-wrap items-start gap-x-4 gap-y-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-control bg-fondo-suave text-accion-primaria"
      >
        <Icono className="size-icono" />
      </span>
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <p className="text-pequeno font-bold text-accion-primaria">{tipo}</p>
        <Titulo className="text-titulo-3">{titulo}</Titulo>
        <p className="flex items-center gap-2">
          <MapPin aria-hidden className="size-icono-pequeno shrink-0" />
          {casa}
        </p>
        {dato && (
          <p className="flex items-center gap-2">
            <dato.icono aria-hidden className="size-icono-pequeno shrink-0" />
            {dato.texto}
          </p>
        )}
        <p className="flex items-center gap-2 text-pequeno text-texto-secundario">
          <Clock aria-hidden className="size-icono-pequeno shrink-0" />
          {fecha}
        </p>
      </div>
      <div className="flex flex-col items-start gap-2">
        {monto && <strong className="text-titulo-2">{monto}</strong>}
        {estado}
      </div>
      {accion && (
        <Link
          href={accion.href}
          className="flex min-h-tactil basis-full items-center justify-end gap-2 font-bold text-texto-enlace underline underline-offset-4"
        >
          {accion.texto}
          <ChevronRight aria-hidden className="size-icono shrink-0" />
        </Link>
      )}
      {children && <div className="flex basis-full flex-col gap-2">{children}</div>}
    </article>
  );
}
