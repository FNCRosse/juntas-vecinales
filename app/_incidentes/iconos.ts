import { Car, CircleHelp, ShieldAlert, Trash2, Volume2 } from "lucide-react";

/** El ícono de cada tipo de incidente, igual en las listas del vecino y de la directiva; el tipo siempre va escrito al lado. */
export const ICONO_CATEGORIA = {
  RUIDOS: Volume2,
  BASURA: Trash2,
  COCHERAS: Car,
  SEGURIDAD: ShieldAlert,
  OTROS: CircleHelp,
} as const;
