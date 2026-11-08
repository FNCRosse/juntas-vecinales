// @HU-ASA-10
// Lo que se anota de una actividad pro fondos antes de su balance (prototipo DAS09): un gasto, siempre con la foto de su
// comprobante, o lo que se cobró en la puerta. El dominio revisa los datos y suma; no sabe de la BD. Montos en céntimos.

export type TipoMovimientoActividad = "GASTO" | "INGRESO_EN_PUERTA";
export const MAXIMO_CONCEPTO = 80;
/** S/ 1 000 000: un tope para que un error de tipeo no anote un monto absurdo. */
export const MAXIMO_MONTO = 100_000_000;

export const TIPO_DE_MOVIMIENTO_EN_TEXTO: Record<TipoMovimientoActividad, string> = {
  GASTO: "Un gasto",
  INGRESO_EN_PUERTA: "Lo cobrado en la puerta",
};

export type DatosMovimiento = {
  tipo: string;
  concepto: string;
  monto: number | null;
  archivoId?: string | null;
};

/** Revisa lo que escribe quien anota: tipo, concepto, monto y, si es un gasto, su comprobante. */
export function prepararMovimiento(datos: DatosMovimiento) {
  const errores: Record<string, string> = {};
  const tipo: TipoMovimientoActividad | null =
    datos.tipo === "GASTO" || datos.tipo === "INGRESO_EN_PUERTA" ? datos.tipo : null;
  if (!tipo) errores.tipo = "Elija si es un gasto o lo cobrado en la puerta.";
  const concepto = datos.concepto.trim().replace(/\s+/g, " ");
  if (!concepto) errores.concepto = "Escriba en qué se gastó o qué se cobró.";
  else if (concepto.length > MAXIMO_CONCEPTO) errores.concepto = `Use ${MAXIMO_CONCEPTO} letras como máximo.`;
  if (datos.monto === null || !Number.isInteger(datos.monto) || datos.monto <= 0) {
    errores.monto = "Escriba cuánto fue.";
  } else if (datos.monto > MAXIMO_MONTO) errores.monto = "Escriba un monto en soles, por ejemplo 150.50.";
  const archivoId = datos.archivoId?.trim() || null;
  if (tipo === "GASTO" && !archivoId) errores.archivoId = "Adjunte la foto del comprobante de este gasto.";
  return {
    errores,
    movimiento: {
      tipo: tipo ?? "GASTO",
      concepto,
      monto: datos.monto ?? 0,
      archivoId: tipo === "GASTO" ? archivoId : null,
    },
  };
}

/**
 * Los totales de una actividad antes de su balance: lo pagado por adelantado (las colaboraciones con su comprobante), lo
 * cobrado en la puerta y lo gastado. Son las mismas cuentas que hará el balance al publicarse.
 */
export function totalesDeActividad(
  anticipados: number[],
  movimientos: { tipo: TipoMovimientoActividad; monto: number }[],
) {
  const suma = (montos: number[]) => montos.reduce((s, m) => s + m, 0);
  const ingresosVirtuales = suma(anticipados);
  const ingresosEnPuerta = suma(
    movimientos.filter((m) => m.tipo === "INGRESO_EN_PUERTA").map((m) => m.monto),
  );
  const egresos = suma(movimientos.filter((m) => m.tipo === "GASTO").map((m) => m.monto));
  const ingresos = ingresosVirtuales + ingresosEnPuerta;
  return { ingresosVirtuales, ingresosEnPuerta, ingresos, egresos, utilidadNeta: ingresos - egresos };
}
