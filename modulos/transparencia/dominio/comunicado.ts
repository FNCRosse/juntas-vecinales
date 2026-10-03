// @HU-ASA-15
// Comunicado general del diagrama 02e: un aviso de la junta que no es de una asamblea ni de una actividad.

export type NivelUrgencia = "INFORMATIVO" | "URGENTE";
export const NIVELES: readonly NivelUrgencia[] = ["INFORMATIVO", "URGENTE"];

export const MAXIMO_TITULO = 120;
export const MAXIMO_CUERPO = 1500;

export type DatosComunicado = { titulo: string; cuerpo: string; urgencia: NivelUrgencia };

/** Revisa y limpia los datos. Los mensajes dicen qué hacer, sin términos técnicos. */
export function prepararComunicado(datos: DatosComunicado) {
  const errores: Record<string, string> = {};
  const titulo = datos.titulo.trim();
  const cuerpo = datos.cuerpo.trim();
  if (!titulo) errores.titulo = "Escriba el título del comunicado.";
  else if (titulo.length > MAXIMO_TITULO) {
    errores.titulo = `El título puede tener hasta ${MAXIMO_TITULO} letras. Hágalo más corto.`;
  }
  if (!cuerpo) errores.cuerpo = "Escriba el mensaje del comunicado.";
  else if (cuerpo.length > MAXIMO_CUERPO) {
    errores.cuerpo = `El mensaje puede tener hasta ${MAXIMO_CUERPO} letras. Hágalo más corto.`;
  }
  if (!NIVELES.includes(datos.urgencia)) {
    errores.urgencia = "Elija si el comunicado es informativo o urgente.";
  }
  return { errores, comunicado: { titulo, cuerpo, urgencia: datos.urgencia } };
}

/** El feed va por fecha, los urgentes primero y sin más jerarquías (modulos/transparencia/CLAUDE.md). */
export function ordenarNoticias<T extends { urgencia: NivelUrgencia; fechaPublicacion: Date }>(
  noticias: T[],
) {
  return [...noticias].sort(
    (a, b) =>
      Number(b.urgencia === "URGENTE") - Number(a.urgencia === "URGENTE") ||
      b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime(),
  );
}
