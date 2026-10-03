// @HU-QUE-05 @HU-QUE-06
import type { Estado } from "./queja";

// Gestión de la queja por la directiva: qué decisión puede tomar en cada estado y qué dato exige.

export const PRIORIDADES = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
} as const;
export type Prioridad = keyof typeof PRIORIDADES;

const MAXIMO_MOTIVO = 500;

export type Admisibilidad =
  { decision: "admitir"; prioridad?: string | null } | { decision: "rechazar"; motivo?: string | null };

/**
 * Admitir asigna prioridad y pasa a EN_REVISION; rechazar exige el motivo y pasa a RECHAZADO (HU-QUE-05
 * CA2, CA3). Solo se evalúa un reporte RECIBIDO.
 */
export function prepararAdmisibilidad(estado: Estado, datos: Admisibilidad) {
  const errores: Record<string, string> = {};
  if (estado !== "RECIBIDO") {
    return { errores, yaEvaluada: true as const };
  }
  if (datos.decision === "admitir") {
    if (!datos.prioridad || !(datos.prioridad in PRIORIDADES)) errores.prioridad = "Elija la prioridad.";
    return {
      errores,
      cambio: {
        estado: "EN_REVISION" as const,
        prioridad: datos.prioridad as Prioridad,
        motivoRechazo: null,
      },
    };
  }
  const motivo = datos.motivo?.trim() ?? "";
  if (!motivo) errores.motivo = "Escriba por qué no procede. Se lo diremos a quien reportó.";
  else if (motivo.length > MAXIMO_MOTIVO)
    errores.motivo = `Escriba el motivo en menos de ${MAXIMO_MOTIVO} letras.`;
  return { errores, cambio: { estado: "RECHAZADO" as const, prioridad: null, motivoRechazo: motivo } };
}

export const MEDIDAS = {
  MEDIACION: "Mediación en persona, con acuerdo",
  LLAMADA_DE_ATENCION: "Llamada de atención al vecino",
  OTRA: "Otra medida",
} as const;
export type Medida = keyof typeof MEDIDAS;
const MAXIMO_DETALLE = 1000;

/**
 * Documenta lo que se hizo (HU-QUE-06 CA1) y cierra como RESUELTO (CA2). Solo un reporte EN_REVISION; el
 * detalle es lo que recibe quien reportó (CA3).
 */
export function prepararResolucion(
  estado: Estado,
  datos: { medida?: string | null; detalle?: string | null },
) {
  const errores: Record<string, string> = {};
  if (estado !== "EN_REVISION") return { errores, noSePuede: true as const };
  if (!datos.medida || !(datos.medida in MEDIDAS)) errores.medida = "Elija qué medida se tomó.";
  const detalle = datos.detalle?.trim() ?? "";
  if (!detalle) errores.detalle = "Escriba qué se hizo. Se lo enviaremos a quien reportó.";
  else if (detalle.length > MAXIMO_DETALLE)
    errores.detalle = `Escriba el detalle en menos de ${MAXIMO_DETALLE} letras.`;
  return { errores, accion: { medida: datos.medida as Medida, detalle } };
}
