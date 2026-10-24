// @HU-COB-03
// Reclamo de cuota (HU-COB-03): los motivos que ofrece la lista y qué se le pide a la casa. El dominio no sabe de la BD ni
// de los archivos.

export const MOTIVOS_RECLAMO = ["SIN_INQUILINO", "MENOS_VEHICULOS", "YA_PAGUE", "OTRO"] as const;
export type MotivoReclamo = (typeof MOTIVOS_RECLAMO)[number];

export const MAXIMO_DETALLE = 300;

/** Lo que elige la casa, con las palabras del prototipo. */
export const MOTIVOS: Record<MotivoReclamo, string> = {
  SIN_INQUILINO: "Ya no tengo inquilino",
  MENOS_VEHICULOS: "Tengo menos autos o motos de lo que figura",
  YA_PAGUE: "Ya pagué y no aparece",
  OTRO: "Otro motivo",
};

/** El número del reclamo como se ve: «R-0027». */
export const numeroDeReclamo = (numero: number) => `R-${String(numero).padStart(4, "0")}`;

/** Revisa lo que escribe la casa: el motivo es obligatorio y «otro motivo» pide contar cuál es. El documento es opcional. */
export function prepararReclamo(datos: { motivo: string; detalle: string }) {
  const errores: Record<string, string> = {};
  const motivo = MOTIVOS_RECLAMO.find((m) => m === datos.motivo);
  const detalle = datos.detalle.trim();
  if (!motivo) errores.motivo = "Elija por qué cree que su cuota no es correcta.";
  if (motivo === "OTRO" && !detalle) errores.detalle = "Cuéntenos cuál es el motivo.";
  else if (detalle.length > MAXIMO_DETALLE) {
    errores.detalle = `Puede escribir hasta ${MAXIMO_DETALLE} letras. Hágalo más corto.`;
  }
  if (Object.keys(errores).length || !motivo) return { errores, reclamo: null };
  return { errores, reclamo: { motivo, detalle: detalle || null } };
}
