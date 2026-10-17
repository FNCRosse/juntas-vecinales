// @HU-ASA-01
// Convocatoria del diagrama 02c: lo que la junta convoca (asamblea o actividad pro fondos). El dominio no
// conoce Prisma ni fechas de infraestructura; recibe los datos ya parseados y los limpia y valida.

export type TipoAsamblea = "ORDINARIA" | "EXTRAORDINARIA";
export const TIPOS_ASAMBLEA: readonly TipoAsamblea[] = ["ORDINARIA", "EXTRAORDINARIA"];

export const MAXIMO_LUGAR = 160;
export const MAXIMO_MOTIVO = 1500;

/** El título del afiche y de la publicación sale del tipo: "Asamblea ordinaria" / "Asamblea extraordinaria". */
export function tituloDeAsamblea(tipo: TipoAsamblea): string {
  return tipo === "EXTRAORDINARIA" ? "Asamblea extraordinaria" : "Asamblea ordinaria";
}

/** Quórum normativo: la mitad del padrón más una casa, un voto por predio (HU-ASA-04). */
export function quorumRequerido(padronTotal: number): number {
  return Math.floor(padronTotal / 2) + 1;
}

export type DatosConvocatoria = {
  tipoAsamblea: TipoAsamblea;
  fechaHora: Date;
  lugar: string;
  motivo: string;
};

/** Revisa y limpia los datos. Los mensajes dicen qué corregir, con trato de usted y sin tecnicismos. */
export function prepararConvocatoria(datos: DatosConvocatoria, ahora = new Date()) {
  const errores: Record<string, string> = {};
  const lugar = datos.lugar.trim();
  const motivo = datos.motivo.trim();

  if (!TIPOS_ASAMBLEA.includes(datos.tipoAsamblea)) {
    errores.tipoAsamblea = "Elija si la asamblea es ordinaria o extraordinaria.";
  }
  if (Number.isNaN(datos.fechaHora.getTime())) {
    errores.fechaHora = "Indique la fecha y la hora de la asamblea.";
  } else if (datos.fechaHora.getTime() <= ahora.getTime()) {
    errores.fechaHora = "La fecha de la asamblea debe ser posterior a hoy.";
  }
  if (!lugar) errores.lugar = "Escriba el lugar de la asamblea.";
  else if (lugar.length > MAXIMO_LUGAR) {
    errores.lugar = `El lugar puede tener hasta ${MAXIMO_LUGAR} letras. Hágalo más corto.`;
  }
  if (!motivo) errores.motivo = "Escriba el motivo de la asamblea.";
  else if (motivo.length > MAXIMO_MOTIVO) {
    errores.motivo = `El motivo puede tener hasta ${MAXIMO_MOTIVO} letras. Hágalo más corto.`;
  }

  return {
    errores,
    convocatoria: {
      tipoAsamblea: datos.tipoAsamblea,
      titulo: errores.tipoAsamblea ? "" : tituloDeAsamblea(datos.tipoAsamblea),
      fechaHora: datos.fechaHora,
      lugar,
      motivo,
    },
  };
}
