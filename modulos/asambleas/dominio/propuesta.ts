// @HU-ASA-13
// Propuesta de tema para la agenda de una asamblea (Ley N.° 26300, participación vecinal). El vecino la envía
// antes del cierre de la agenda y la directiva decide si la incluye (HU-ASA-14).

export type EstadoPropuesta = "PENDIENTE_REVISION" | "INCLUIDA" | "NO_INCLUIDA";

export const MAXIMO_TITULO = 120;
/** «Unas pocas líneas bastan» (prototipo): una justificación breve. */
export const MAXIMO_JUSTIFICACION = 500;

/**
 * Cuántos días antes de la asamblea se cierra la agenda. Es el valor del prototipo (la asamblea del sábado 10
 * se cierra el jueves 1); la directiva debe confirmarlo. Se cambia solo aquí.
 */
export const DIAS_ANTES_DEL_CIERRE_DE_AGENDA = 9;

export type DatosPropuesta = { titulo: string; justificacion: string };

/** Revisa y limpia los datos. Los mensajes dicen qué corregir, con trato de usted y sin tecnicismos. */
export function prepararPropuesta(datos: DatosPropuesta) {
  const errores: Record<string, string> = {};
  const titulo = datos.titulo.trim().replace(/\s+/g, " ");
  const justificacion = datos.justificacion.trim();

  if (!titulo) errores.titulo = "Escriba el tema que quiere proponer.";
  else if (titulo.length > MAXIMO_TITULO) {
    errores.titulo = `El tema puede tener hasta ${MAXIMO_TITULO} letras. Hágalo más corto.`;
  }
  if (!justificacion) errores.justificacion = "Cuéntenos por qué es importante, en unas pocas líneas.";
  else if (justificacion.length > MAXIMO_JUSTIFICACION) {
    errores.justificacion = `Puede escribir hasta ${MAXIMO_JUSTIFICACION} letras. Hágalo más corto: unas pocas líneas bastan.`;
  }
  return { errores, propuesta: { titulo, justificacion } };
}

export type DecisionPropuesta = "INCLUIR" | "NO_INCLUIR";

export const MAXIMO_MOTIVO_DECISION = 200;

/** Los motivos que la pantalla ofrece al descartar una propuesta (prototipo DAS04); el vecino los recibe tal cual. */
export const MOTIVOS_DE_DESCARTE = [
  "Ya se trató en otra asamblea",
  "No le corresponde a la junta",
  "Falta información: se la pediremos al vecino",
] as const;

/** Revisa la decisión de la directiva (HU-ASA-14 CA2): incluir no pide motivo; no incluir, un motivo breve. */
export function prepararDecision(datos: { decision: DecisionPropuesta; motivo: string }) {
  const errores: Record<string, string> = {};
  const motivo = datos.motivo.trim();
  if (datos.decision !== "INCLUIR" && datos.decision !== "NO_INCLUIR") {
    errores.decision = "Elija si incluye la propuesta en la agenda o no.";
  } else if (datos.decision === "NO_INCLUIR") {
    if (!motivo) errores.motivo = "Elija o escriba un motivo breve: se lo enviaremos al vecino.";
    else if (motivo.length > MAXIMO_MOTIVO_DECISION) {
      errores.motivo = `El motivo puede tener hasta ${MAXIMO_MOTIVO_DECISION} letras. Hágalo más corto.`;
    }
  }
  return { errores, motivo: datos.decision === "NO_INCLUIR" ? motivo : null };
}
