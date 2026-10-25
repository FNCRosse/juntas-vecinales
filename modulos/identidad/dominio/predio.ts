// @HU-GAR-01 @HU-GAR-10 @HU-GAR-09
// Predio del diagrama 02a con su ocupación. M1 la guarda; el monto de la cuota lo calcula M5 con ella.

export type UsoPredio = "VIVIENDA" | "NEGOCIO" | "VIVIENDA_Y_NEGOCIO";

export const CONCEPTOS = ["familias", "inquilinos", "autos", "motos", "triciclos", "negocios"] as const;
export type Concepto = (typeof CONCEPTOS)[number];
export type Ocupacion = Record<Concepto, number>;

/** El rubro de la ocupación del predio que corresponde a cada concepto de la tarifa (HU-COB-16, diagrama 02b). */
export const RUBRO_DE_CONCEPTO = {
  casa: "familias",
  inquilino: "inquilinos",
  auto: "autos",
  moto: "motos",
  triciclo: "triciclos",
  negocio: "negocios",
} as const;

/** La ocupación de un predio por la clave de cada concepto de la tarifa («auto»: 2), como la usa M5 para calcular la cuota. */
export const ocupacionPorClave = (ocupacion: Ocupacion) =>
  Object.fromEntries(
    Object.entries(RUBRO_DE_CONCEPTO).map(([clave, rubro]) => [clave, ocupacion[rubro]]),
  ) as Record<string, number>;

/** Tope por concepto del contador de la pantalla (prototipo ADM-PAD-03). */
export const MAXIMO_POR_CONCEPTO = 9;

export const NOMBRE_CONCEPTO: Record<Concepto, [singular: string, plural: string]> = {
  familias: ["familia", "familias"],
  inquilinos: ["inquilino", "inquilinos"],
  autos: ["auto o camioneta", "autos o camionetas"],
  motos: ["moto", "motos"],
  triciclos: ["triciclo o carreta", "triciclos o carretas"],
  negocios: ["local de negocio", "locales de negocio"],
};

/** "1 familia · 1 auto o camioneta": solo los conceptos que tiene. */
export function ocupacionEnTexto(ocupacion: Ocupacion) {
  return CONCEPTOS.filter((c) => ocupacion[c] > 0)
    .map((c) => `${ocupacion[c]} ${NOMBRE_CONCEPTO[c][ocupacion[c] === 1 ? 0 : 1]}`)
    .join(" · ");
}

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

/** Los conceptos que cambian entre dos ocupaciones, con su valor antes y después (HU-GAR-10 CA3). */
export function cambiosDeOcupacion(
  antes: { uso: UsoPredio } & Ocupacion,
  despues: { uso: UsoPredio } & Ocupacion,
): { campo: "uso" | Concepto; antes: string | number; despues: string | number }[] {
  const campos: ("uso" | Concepto)[] = ["uso", ...CONCEPTOS];
  return campos
    .filter((campo) => antes[campo] !== despues[campo])
    .map((campo) => ({ campo, antes: antes[campo], despues: despues[campo] }));
}

export const MOTIVOS_BAJA_RESIDENTE = {
  MUDANZA: "Se mudó del barrio",
  FALLECIMIENTO: "Falleció",
  OTRO: "Otro motivo",
} as const;
export type MotivoBajaResidente = keyof typeof MOTIVOS_BAJA_RESIDENTE;
