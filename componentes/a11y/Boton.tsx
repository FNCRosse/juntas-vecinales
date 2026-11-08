// @HU-ACC-09
import type { LucideIcon } from "lucide-react";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

// Botón de la guía visual §5.1: 48 px de alto (56 en Senior), texto de 20 px en negrita, ícono a la
// izquierda. Un solo primario por pantalla. El de peligro lleva siempre su ícono (WCAG 1.4.1).

/** "peligroContorno": la acción que deshace algo propio sin ser la principal ("Anular esta visita"). */
/** "enlace": acción de texto subrayado, sin borde ("Ahora no", "Marcar todos como leídos"). */
export type VarianteBoton = "primario" | "secundario" | "peligro" | "peligroContorno" | "enlace";

const BASE =
  "inline-flex items-center justify-center gap-2 min-w-tactil rounded-control " +
  "border-(length:--borde-ancho-control) font-bold leading-titulo text-center no-underline cursor-pointer " +
  "aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-accion-deshabilitada " +
  "aria-disabled:text-texto-deshabilitado aria-disabled:border-borde-control";

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    "bg-accion-primaria text-texto-invertido border-accion-primaria hover:bg-accion-primaria-hover active:bg-accion-primaria-presionada",
  secundario:
    "bg-fondo-superficie text-accion-primaria border-accion-primaria hover:bg-accion-secundaria-hover active:bg-accion-secundaria-presionada",
  peligro:
    "bg-accion-peligro text-texto-invertido border-accion-peligro hover:bg-accion-peligro-hover active:bg-accion-peligro-presionada",
  peligroContorno: "bg-fondo-superficie text-texto-error border-borde-error hover:bg-fondo-error",
  enlace:
    "bg-transparent text-texto-enlace border-transparent underline underline-offset-4 hover:text-accion-primaria-hover",
};

/** Botones de la barra superior ("Vista grande", "Pedir ayuda"), iguales al prototipo C-08 y C-11. */
export function clasesBotonBarra(activo = false) {
  return (
    "inline-flex md:whitespace-nowrap min-h-control min-w-tactil items-center justify-center gap-2 rounded-control px-3 py-1 " +
    "border-(length:--borde-ancho-control) border-accion-primaria text-base font-bold leading-titulo text-center no-underline cursor-pointer " +
    (activo
      ? "bg-accion-primaria text-texto-invertido hover:bg-accion-primaria-hover active:bg-accion-primaria-presionada"
      : "bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover active:bg-accion-secundaria-presionada")
  );
}

/** Normal: 48 px (56 en Senior) y texto de 20 px. Compacto: el del prototipo para acciones dentro de una
 * tarjeta o al pie ("Ver la guía", "Cerrar sesión"): mismo alto táctil, texto de 18 px. */
const TAMANOS = {
  normal: "min-h-control px-6 py-2 text-grande",
  compacto: "min-h-tactil px-4 text-base self-start",
};

export function clasesBoton(variante: VarianteBoton = "primario", anchoCompleto = false, compacto = false) {
  const tamano =
    variante === "enlace" ? "min-h-tactil text-base self-start" : TAMANOS[compacto ? "compacto" : "normal"];
  return `${BASE} ${tamano} ${VARIANTES[variante]}${anchoCompleto ? " w-full" : ""}`;
}

type Comunes = {
  variante?: VarianteBoton;
  icono?: LucideIcon;
  /** El primario va a todo el ancho en el teléfono. */
  anchoCompleto?: boolean;
  compacto?: boolean;
  children: ReactNode;
};

type PropsBoton = Comunes &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Mientras se envía: muestra "Enviando…" y lo anuncia con aria-busy. */
    cargando?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

function Contenido({ variante, icono: Icono, children }: Comunes) {
  const IconoFinal = Icono ?? (variante?.startsWith("peligro") ? TriangleAlert : undefined);
  return (
    <>
      {IconoFinal && <IconoFinal aria-hidden className="size-icono shrink-0" />}
      <span>{children}</span>
    </>
  );
}

export function Boton({
  variante,
  icono,
  anchoCompleto,
  compacto,
  cargando,
  children,
  className,
  type,
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type ?? "button"}
      aria-busy={cargando || undefined}
      className={`${clasesBoton(variante, anchoCompleto, compacto)} ${className ?? ""}`}
      {...resto}
    >
      <Contenido variante={variante} icono={icono}>
        {cargando ? "Enviando…" : children}
      </Contenido>
    </button>
  );
}

/** Enlace con aspecto de botón: navega, no ejecuta una acción. */
export function BotonEnlace({
  variante,
  icono,
  anchoCompleto,
  compacto,
  children,
  href,
}: Comunes & { href: string }) {
  return (
    <Link href={href} className={clasesBoton(variante, anchoCompleto, compacto)}>
      <Contenido variante={variante} icono={icono}>
        {children}
      </Contenido>
    </Link>
  );
}
