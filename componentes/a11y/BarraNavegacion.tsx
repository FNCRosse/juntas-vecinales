"use client";

import {
  CalendarDays,
  DoorOpen,
  Ellipsis,
  HandHeart,
  House,
  LayoutDashboard,
  LifeBuoy,
  type LucideIcon,
  MapPin,
  NotebookPen,
  ScrollText,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegación por actor (prototipo C-10; FRONTEND.md §1). Inferior en el teléfono y
// superior desde la tablet. En el teléfono tiene como máximo cuatro destinos, en normal y en Senior
// (R-11); lo demás está en "Más" o en un atajo del inicio, y la barra de la tablet lo muestra.

export type Actor = "vecino" | "directiva" | "administrador" | "garita";

type Opcion = {
  etiqueta: string;
  href: string;
  Icono: LucideIcon;
  clase?: string;
  /** Otras rutas que pertenecen a este destino (prototipo: Mis visitas y Transparencia están en "Más"). */
  tambien?: string[];
  /** Rutas que en el teléfono se marcan aquí porque su destino propio solo aparece desde la tablet. */
  enTelefono?: string[];
};

const DESDE_TABLET = "hidden md:block";

export const OPCIONES_POR_ACTOR: Record<Actor, Opcion[]> = {
  vecino: [
    {
      etiqueta: "Inicio",
      href: "/",
      Icono: House,
      tambien: ["/avisos", "/noticias"],
      enTelefono: ["/incidentes", "/actividades"],
    },
    { etiqueta: "Mi cuota", href: "/cuota", Icono: Wallet },
    { etiqueta: "Asambleas", href: "/asambleas", Icono: CalendarDays },
    { etiqueta: "Incidentes", href: "/incidentes", Icono: MapPin, clase: DESDE_TABLET },
    { etiqueta: "Actividades", href: "/actividades", Icono: HandHeart, clase: DESDE_TABLET },
    {
      etiqueta: "Más",
      href: "/mas",
      Icono: Ellipsis,
      tambien: ["/visitas", "/transparencia", "/avisos/preferencias"],
    },
  ],
  directiva: [
    { etiqueta: "Resumen", href: "/directiva", Icono: LayoutDashboard },
    { etiqueta: "Cobros", href: "/directiva/cobros", Icono: Wallet },
    { etiqueta: "Incidentes", href: "/directiva/incidentes", Icono: MapPin },
    { etiqueta: "Asambleas", href: "/directiva/asambleas", Icono: CalendarDays, clase: DESDE_TABLET },
    {
      etiqueta: "Actividades",
      href: "/directiva/actividades",
      Icono: HandHeart,
      clase: DESDE_TABLET,
      tambien: ["/directiva/balances"],
    },
    { etiqueta: "Ayuda pedida", href: "/directiva/pedidos-de-ayuda", Icono: LifeBuoy, clase: DESDE_TABLET },
    { etiqueta: "Más", href: "/directiva/mas", Icono: Ellipsis },
  ],
  administrador: [
    { etiqueta: "Inicio", href: "/administracion", Icono: LayoutDashboard },
    { etiqueta: "Padrón", href: "/administracion/padron", Icono: House },
    { etiqueta: "Equipo", href: "/administracion/equipo", Icono: Users },
    { etiqueta: "Privacidad", href: "/administracion/privacidad", Icono: ShieldCheck, clase: DESDE_TABLET },
    { etiqueta: "Auditoría", href: "/administracion/auditoria", Icono: ScrollText, clase: DESDE_TABLET },
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

const dentroDe = (ruta: string, prefijo: string) => ruta === prefijo || ruta.startsWith(`${prefijo}/`);

/** Largo del prefijo con el que la ruta cae en la opción (-1 si no cae): gana el más específico. */
function coincidencia(ruta: string, { href, tambien = [] }: Opcion) {
  const propia = INICIOS.has(href)
    ? ruta === href
      ? href.length
      : -1
    : dentroDe(ruta, href)
      ? href.length
      : -1;
  return Math.max(propia, ...tambien.map((p) => (dentroDe(ruta, p) ? p.length : -1)));
}

/** El destino de la barra que corresponde a la ruta, como en el prototipo. */
export function destinoActual(actor: Actor, ruta: string) {
  let mejor: Opcion | undefined;
  for (const opcion of OPCIONES_POR_ACTOR[actor])
    if (coincidencia(ruta, opcion) > (mejor ? coincidencia(ruta, mejor) : -1)) mejor = opcion;
  return mejor?.href;
}

const ACTUAL = "border-accion-primaria bg-fondo-suave font-bold text-accion-primaria";

export function BarraNavegacion({
  actor,
  conteos = {},
}: {
  actor: Actor;
  /** Cuántas cosas esperan en un destino (por su href): se ve como una insignia junto al ícono (prototipo C-10). */
  conteos?: Record<string, number>;
}) {
  const ruta = usePathname();
  const actual = destinoActual(actor, ruta);
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde-control bg-fondo-superficie md:static md:border-t-0 md:border-b md:border-borde-sutil lg:w-64 lg:shrink-0 lg:self-stretch lg:border-b-0 lg:border-r"
    >
      <ul className="mx-auto flex max-w-300 gap-separacion p-1 md:justify-center md:px-4 lg:mx-0 lg:flex-col lg:justify-start lg:px-2 lg:py-4">
        {OPCIONES_POR_ACTOR[actor].map(({ etiqueta, href, Icono, clase, enTelefono = [] }) => {
          const esActual = actual === href;
          // Solo se ve el resaltado: el aria-current queda en el destino propio, oculto en el teléfono.
          const soloEnTelefono = !esActual && enTelefono.some((p) => dentroDe(ruta, p));
          return (
            <li key={href} className={`flex-auto md:flex-none ${clase ?? ""}`}>
              <Link
                href={href}
                lang="es"
                aria-current={esActual ? "page" : undefined}
                className={`flex min-h-16 min-w-tactil flex-col items-center justify-center gap-1 rounded-b-control border-t-(length:--borde-ancho-control) px-1 py-1 text-center text-barra leading-titulo no-underline hover:bg-fondo-suave md:flex-row md:gap-2 md:px-3 lg:justify-start lg:rounded-control lg:border-l-(length:--borde-ancho-control) lg:border-t-0 lg:px-4 ${
                  esActual
                    ? ACTUAL
                    : soloEnTelefono
                      ? "border-transparent text-texto-secundario max-md:border-accion-primaria max-md:bg-fondo-suave max-md:font-bold max-md:text-accion-primaria"
                      : "border-transparent text-texto-secundario"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Icono aria-hidden className="size-icono shrink-0" />
                  {!esActual && conteos[href] > 0 && (
                    <span className="min-w-6 rounded-pastilla border border-borde-info bg-fondo-info px-1 text-center font-bold text-texto-info">
                      {conteos[href]}
                      <span className="sr-only"> por atender</span>
                    </span>
                  )}
                </span>
                <span className="max-w-full">{etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
