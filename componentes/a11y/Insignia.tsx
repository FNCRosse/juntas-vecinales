import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Badge del prototipo (C-06): pastilla con borde, fondo suave, ícono y texto en negrita. El ícono va
// siempre, para que el estado no dependa solo del color (WCAG 1.4.1).

export type TonoInsignia = "info" | "exito" | "aviso" | "error";

const TONOS: Record<TonoInsignia, string> = {
  info: "border-borde-info bg-fondo-info text-texto-info",
  exito: "border-borde-exito bg-fondo-exito text-texto-exito",
  aviso: "border-borde-aviso bg-fondo-aviso text-texto-aviso",
  error: "border-borde-error bg-fondo-error text-texto-error",
};

export function Insignia({
  tono,
  icono: Icono,
  children,
}: {
  tono: TonoInsignia;
  icono: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 py-1 text-pequeno font-bold ${TONOS[tono]}`}
    >
      <Icono aria-hidden className="size-icono-pequeno shrink-0" />
      {children}
    </span>
  );
}
