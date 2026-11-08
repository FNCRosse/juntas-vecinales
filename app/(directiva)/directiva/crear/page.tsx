import {
  Banknote,
  CalendarPlus,
  FileText,
  HandHeart,
  Landmark,
  type LucideIcon,
  Megaphone,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { Volver } from "@/componentes/a11y/Volver";

export const metadata: Metadata = { title: "Crear o registrar" };

const OPCIONES: { href: string; icono: LucideIcon; titulo: string; detalle: string }[] = [
  {
    href: "/directiva/comunicados/nuevo",
    icono: Megaphone,
    titulo: "Comunicado a la comunidad",
    detalle: "Corte de agua o luz, seguridad, avisos",
  },
  {
    href: "/directiva/asambleas/nueva",
    icono: CalendarPlus,
    titulo: "Asamblea",
    detalle: "Convocatoria con afiche para imprimir",
  },
  {
    href: "/directiva/actividades/nueva",
    icono: HandHeart,
    titulo: "Actividad pro-fondos",
    detalle: "Pollada, bingo, rifa u otra",
  },
  {
    href: "/directiva/cuentas/registrar",
    icono: Banknote,
    titulo: "Ingreso o gasto",
    detalle: "Con la foto del comprobante",
  },
  {
    href: "/directiva/actas/nueva",
    icono: FileText,
    titulo: "Acta de la asamblea",
    detalle: "Acuerdos y PDF oficial",
  },
  {
    href: "/directiva/balances/nuevo",
    icono: Landmark,
    titulo: "Balance de una actividad",
    detalle: "Lo que se juntó y en qué se gastó",
  },
];

// Desde dónde se llegó (?desde=…): "Volver" regresa a esa pestaña; sin dato, al resumen.
const ORIGENES: Record<string, { href: string; texto: string }> = {
  resumen: { href: "/directiva", texto: "Volver al resumen" },
  asambleas: { href: "/directiva/asambleas", texto: "Volver a asambleas" },
  mas: { href: "/directiva/mas/comunidad", texto: "Volver a comunidad" },
};

// DIR-ASA-16 (prototipo DAS11): el menú para crear o registrar, una tarjeta por opción. Cada una tiene dos pasos y
// siempre se puede revisar antes de publicar.
export default async function CrearDirectiva({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { desde } = await searchParams;
  const origen = ORIGENES[desde ?? ""] ?? ORIGENES.resumen;
  return (
    <div className="flex flex-col gap-6">
      <Volver href={origen.href}>{origen.texto}</Volver>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">¿Qué quiere crear o registrar?</h1>
        <p className="text-texto-secundario">
          Elija una opción. Cada una tiene dos pasos y siempre puede revisar antes de publicar.
        </p>
      </div>
      <ul className="grid gap-separacion md:grid-cols-2">
        {OPCIONES.map(({ href, icono: Icono, titulo, detalle }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full min-h-16 items-center gap-3 rounded-tarjeta border-(length:--borde-ancho-control) border-accion-primaria bg-fondo-superficie px-4 py-3 text-texto-principal no-underline shadow-tarjeta hover:bg-accion-secundaria-hover senior:px-6"
            >
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center rounded-pastilla bg-accion-primaria text-texto-invertido"
              >
                <Icono className="size-icono" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <strong className="text-grande">{titulo}</strong>
                <span className="text-pequeno text-texto-secundario">{detalle}</span>
              </span>
              <Plus aria-hidden className="size-icono shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
