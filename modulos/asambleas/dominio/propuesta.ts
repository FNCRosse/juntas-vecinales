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
