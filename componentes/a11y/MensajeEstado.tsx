import { CircleCheck, CircleX, Info, type LucideIcon, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

// Alerta de la guía visual §5.7: color + ícono + título (WCAG 1.4.1). Se anuncia sin mover el foco
// (role="status"; "alert" si es un error) y no desaparece sola (WCAG 2.2.1).

export type TipoMensaje = "exito" | "aviso" | "error" | "info";

const ESTILOS: Record<TipoMensaje, { clases: string; icono: string; Icono: LucideIcon }> = {
  exito: { clases: "bg-fondo-exito border-borde-exito", icono: "text-texto-exito", Icono: CircleCheck },
  aviso: { clases: "bg-fondo-aviso border-borde-aviso", icono: "text-texto-aviso", Icono: TriangleAlert },
  error: { clases: "bg-fondo-error border-borde-error", icono: "text-texto-error", Icono: CircleX },
  info: { clases: "bg-fondo-info border-borde-info", icono: "text-texto-info", Icono: Info },
};

export function MensajeEstado({
  tipo,
  titulo,
  children,
}: {
  tipo: TipoMensaje;
  titulo: string;
  /** Qué hacer a continuación, o la acción ("Volver a intentar"). */
  children?: ReactNode;
}) {
  const { clases, icono, Icono } = ESTILOS[tipo];
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex gap-3 p-4 senior:p-6 rounded-control border-(length:--borde-ancho-control) text-texto-principal ${clases}`}
    >
      <Icono aria-hidden className={`size-icono shrink-0 ${icono}`} />
      <div className="flex flex-col gap-2">
        <p className="font-bold">{titulo}</p>
        {children}
      </div>
    </div>
  );
}
