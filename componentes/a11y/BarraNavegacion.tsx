"use client";

import {
  CalendarDays,
  DoorOpen,
  Ellipsis,
  House,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  NotebookPen,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegación por actor (prototipo C-10; FRONTEND.md §1). Inferior en el teléfono y
// superior desde la tablet. En Senior quedan cuatro opciones: lo demás pasa a "Más".

export type Actor = "vecino" | "directiva" | "administrador" | "garita";

type Opcion = { etiqueta: string; href: string; Icono: LucideIcon; ocultaEnSenior?: boolean };

export const OPCIONES_POR_ACTOR: Record<Actor, Opcion[]> = {
  vecino: [
    { etiqueta: "Inicio", href: "/", Icono: House },
    { etiqueta: "Mi cuota", href: "/cuota", Icono: Wallet },
    { etiqueta: "Asambleas", href: "/asambleas", Icono: CalendarDays },
    { etiqueta: "Incidentes", href: "/incidentes", Icono: MapPin, ocultaEnSenior: true },
    { etiqueta: "Más", href: "/mas", Icono: Ellipsis },
  ],
  directiva: [
    { etiqueta: "Resumen", href: "/directiva", Icono: LayoutDashboard },
    { etiqueta: "Cobros", href: "/directiva/cobros", Icono: Wallet },
    { etiqueta: "Incidentes", href: "/directiva/incidentes", Icono: MapPin },
    { etiqueta: "Asambleas", href: "/directiva/asambleas", Icono: CalendarDays, ocultaEnSenior: true },
    { etiqueta: "Más", href: "/directiva/mas", Icono: Ellipsis },
  ],
  administrador: [
    { etiqueta: "Inicio", href: "/administracion", Icono: LayoutDashboard },
    { etiqueta: "Padrón", href: "/administracion/padron", Icono: House },
    { etiqueta: "Equipo", href: "/administracion/equipo", Icono: Users },
    { etiqueta: "Privacidad", href: "/administracion/privacidad", Icono: ShieldCheck, ocultaEnSenior: true },
    { etiqueta: "Más", href: "/administracion/mas", Icono: Ellipsis },
  ],
  garita: [
    { etiqueta: "Inicio", href: "/garita", Icono: DoorOpen },
    { etiqueta: "Consultar", href: "/garita/consultar", Icono: Search },
    { etiqueta: "Visitas", href: "/garita/visitas", Icono: UserRound },
    { etiqueta: "Bitácora", href: "/garita/bitacora", Icono: NotebookPen },
  ],
};

const INICIOS = new Set(Object.values(OPCIONES_POR_ACTOR).map((opciones) => opciones[0].href));

const esActual = (ruta: string, href: string) =>
  INICIOS.has(href) ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);

export function BarraNavegacion({ actor }: { actor: Actor }) {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde-control bg-fondo-superficie md:static md:border-t-0 md:border-b md:border-borde-sutil"
    >
      <ul className="mx-auto flex max-w-300 gap-separacion p-1 md:px-4">
        {OPCIONES_POR_ACTOR[actor].map(({ etiqueta, href, Icono, ocultaEnSenior }) => (
          <li key={href} className={`min-w-0 flex-1 md:flex-none ${ocultaEnSenior ? "senior:hidden" : ""}`}>
            <Link
              href={href}
              lang="es"
              aria-current={esActual(ruta, href) ? "page" : undefined}
              className="flex min-h-16 min-w-tactil flex-col items-center justify-center gap-1 rounded-b-control border-t-(length:--borde-ancho-control) border-transparent px-1 py-1 text-center text-pequeno leading-titulo text-texto-secundario no-underline hyphens-auto break-words hover:bg-fondo-suave aria-[current=page]:border-accion-primaria aria-[current=page]:bg-fondo-suave aria-[current=page]:font-bold aria-[current=page]:text-accion-primaria md:flex-row md:gap-2 md:px-3"
            >
              <Icono aria-hidden className="size-icono shrink-0" />
              <span className="max-w-full">{etiqueta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
