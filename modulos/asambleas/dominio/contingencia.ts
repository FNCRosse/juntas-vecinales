// @HU-ASA-05
// Contingencia por falta de quórum: al corte de las confirmaciones, si el quórum proyectado no alcanza, la
// directiva reprograma la asamblea o la convierte en sesión informativa (sin votaciones ni acuerdos).

export type Decision = "REPROGRAMAR" | "INFORMATIVA";
export const DECISIONES: readonly Decision[] = ["REPROGRAMAR", "INFORMATIVA"];

export type EstadoConvocatoria = "BORRADOR" | "PUBLICADA" | "REPROGRAMADA" | "INFORMATIVA" | "CERRADA";

/** Revisa la decisión. Los mensajes dicen qué corregir, con trato de usted y sin tecnicismos. */
export function prepararContingencia(
  datos: { decision: Decision; nuevaFechaHora: Date | null },
  ahora = new Date(),
) {
  const errores: Record<string, string> = {};
  if (!DECISIONES.includes(datos.decision)) {
    errores.decision = "Elija si reprograma la asamblea o la convierte en una sesión informativa.";
  } else if (datos.decision === "REPROGRAMAR") {
    if (!datos.nuevaFechaHora || Number.isNaN(datos.nuevaFechaHora.getTime())) {
      errores.nuevaFechaHora = "Indique la nueva fecha y la hora de la asamblea.";
    } else if (datos.nuevaFechaHora.getTime() <= ahora.getTime()) {
      errores.nuevaFechaHora = "La nueva fecha debe ser posterior a hoy.";
    }
  }
  return errores;
}

export type ResultadoAdmision = "si" | "estado" | "antes_del_corte" | "alcanza";

/**
 * Si se puede decidir: la asamblea sigue vigente (publicada o ya reprogramada), llegó el corte y el quórum
 * proyectado no alcanza. Cualquier otro caso dice por qué no, para dar el mensaje correcto.
 */
export function admiteContingencia(
  asamblea: { estado: EstadoConvocatoria; alcanza: boolean; confirmacionesHasta: Date },
  ahora = new Date(),
): ResultadoAdmision {
  if (asamblea.estado !== "PUBLICADA" && asamblea.estado !== "REPROGRAMADA") return "estado";
  if (ahora.getTime() < asamblea.confirmacionesHasta.getTime()) return "antes_del_corte";
  if (asamblea.alcanza) return "alcanza";
  return "si";
}
