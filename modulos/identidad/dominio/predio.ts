// @HU-GAR-01
// Predio del diagrama 02a con su ocupación. M1 la guarda; el monto de la cuota lo calcula M5 con ella.

export type UsoPredio = "VIVIENDA" | "NEGOCIO" | "VIVIENDA_Y_NEGOCIO";

export const CONCEPTOS = ["familias", "inquilinos", "autos", "motos", "triciclos", "negocios"] as const;
export type Concepto = (typeof CONCEPTOS)[number];
export type Ocupacion = Record<Concepto, number>;

/** Tope por concepto del contador de la pantalla (prototipo ADM-PAD-03). */
export const MAXIMO_POR_CONCEPTO = 9;

export type DatosPredio = { manzana: string; lote: string; uso: UsoPredio } & Ocupacion;

/** "Mz. C, lote 7": así se nombra un predio en todas las pantallas. */
export function direccion({ manzana, lote }: { manzana: string; lote: string }) {
  return `Mz. ${manzana}, lote ${lote}`;
}

/**
 * Normaliza y revisa los datos de un predio nuevo. Devuelve los errores por campo, vacío si está
 * bien. La manzana se guarda en mayúsculas y el lote sin espacios, para que el lote único funcione.
 */
export function normalizarPredio(datos: DatosPredio): {
  predio: DatosPredio;
  errores: Record<string, string>;
} {
  const predio = { ...datos, manzana: datos.manzana.trim().toUpperCase(), lote: datos.lote.trim() };
  const errores: Record<string, string> = {};
  if (!predio.manzana) errores.manzana = "Falta la manzana. Escriba su letra, por ejemplo C.";
  if (!predio.lote) errores.lote = "Falta el número de lote. Escríbalo en el campo Lote.";
  for (const concepto of CONCEPTOS) {
    const minimo = concepto === "familias" && predio.uso !== "NEGOCIO" ? 1 : 0;
    const valor = predio[concepto];
    if (!Number.isInteger(valor) || valor < minimo || valor > MAXIMO_POR_CONCEPTO) {
      errores[concepto] = `Elija un número entre ${minimo} y ${MAXIMO_POR_CONCEPTO}.`;
    }
  }
  return { predio, errores };
}
