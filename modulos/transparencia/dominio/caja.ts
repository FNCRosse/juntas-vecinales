// @HU-COB-14
// La caja de vigilancia (diagrama 02e): lo que entra y sale además de las cuotas, la rendición de cuentas de un mes y la garantía
// de que el balance que ven los vecinos no identifica a nadie. El dominio no sabe de la BD. Montos en céntimos enteros; días y
// meses, «AAAA-MM-DD» y «AAAA-MM» en hora de Lima.

export const CONCEPTOS_DE_GASTO = {
  VIGILANTES: "Pago a vigilantes",
  SERVICIOS: "Luz o agua de la garita",
  MANTENIMIENTO: "Mantenimiento o reparación",
  UTILES: "Útiles y materiales",
  OTRO_GASTO: "Otro gasto",
} as const;
export const CONCEPTOS_DE_INGRESO = { DONACION: "Donación", OTRO_INGRESO: "Otro ingreso" } as const;
const CONCEPTOS: Record<string, string> = { ...CONCEPTOS_DE_GASTO, ...CONCEPTOS_DE_INGRESO };
export const nombreDelConcepto = (clave: string) => CONCEPTOS[clave] ?? clave;

export type TipoDeMovimiento = "INGRESO" | "GASTO";
export const MAXIMO_DETALLE = 120;
/** S/ 1 000 000: un tope para que un error de tipeo no registre un monto absurdo. */
export const MAXIMO_MONTO = 100_000_000;

const esDia = (texto: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(texto) && new Date(`${texto}T12:00:00Z`).toISOString().slice(0, 10) === texto;

/** Revisa lo que escribe quien registra un ingreso o un gasto; un gasto siempre lleva la foto de su comprobante. */
export function prepararMovimiento(
  datos: {
    tipo: string;
    monto: number | null;
    concepto: string;
    detalle: string;
    fecha: string;
    archivoId: string;
  },
  hoy: string,
) {
  const errores: Record<string, string> = {};
  const tipo: TipoDeMovimiento | null =
    datos.tipo === "GASTO" ? "GASTO" : datos.tipo === "INGRESO" ? "INGRESO" : null;
  if (!tipo) errores.tipo = "Elija si es un gasto o un ingreso.";
  if (datos.monto === null || !Number.isInteger(datos.monto) || datos.monto <= 0) {
    errores.monto = "Escriba cuánto fue.";
  } else if (datos.monto > MAXIMO_MONTO) errores.monto = "Escriba un monto en soles, por ejemplo 150.50.";
  const lista = tipo === "INGRESO" ? CONCEPTOS_DE_INGRESO : CONCEPTOS_DE_GASTO;
  if (tipo && !(datos.concepto in lista)) {
    errores.concepto = tipo === "INGRESO" ? "Elija de dónde viene." : "Elija en qué se gastó.";
  }
  const detalle = datos.detalle.trim();
  if (detalle.length > MAXIMO_DETALLE) {
    errores.detalle = `Puede escribir hasta ${MAXIMO_DETALLE} letras. Hágalo más corto.`;
  }
  if (!esDia(datos.fecha)) errores.fecha = "Elija la fecha del movimiento.";
  else if (datos.fecha > hoy) errores.fecha = "La fecha no puede ser futura.";
  if (tipo === "GASTO" && !datos.archivoId) errores.archivoId = "Adjunte la foto del comprobante del gasto.";
  if (Object.keys(errores).length || !tipo) return { errores, movimiento: null };
  return {
    errores,
    movimiento: {
      tipo,
      monto: datos.monto!,
      concepto: datos.concepto,
      detalle: detalle || null,
      fecha: datos.fecha,
      archivoId: datos.archivoId || null,
    },
  };
}

export const mesValido = (mes: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);

/** El primero y el último día del mes: «2026-09» → «2026-09-01» y «2026-09-30». */
export function rangoDelMes(mes: string) {
  const [anio, numero] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(anio, numero, 0)).getUTCDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

/**
 * La rendición del mes: ingresos (las cuotas, que son los recibos, y los otros ingresos), gastos y saldo, y en qué se gastó
 * por concepto, del mayor al menor (DIR-TRA-01).
 */
export function resumirMes(datos: {
  cuotas: number;
  movimientos: { tipo: TipoDeMovimiento; concepto: string; monto: number; archivoId: string | null }[];
}) {
  const suma = (tipo: TipoDeMovimiento) =>
    datos.movimientos.filter((m) => m.tipo === tipo).reduce((total, m) => total + m.monto, 0);
  const gastos = datos.movimientos.filter((m) => m.tipo === "GASTO");
  const porConcepto = new Map<string, number>();
  for (const g of gastos) porConcepto.set(g.concepto, (porConcepto.get(g.concepto) ?? 0) + g.monto);
  const ingresosOtros = suma("INGRESO");
  return {
    ingresosPorCuotas: datos.cuotas,
    ingresosOtros,
    ingresos: datos.cuotas + ingresosOtros,
    gastos: suma("GASTO"),
    saldo: datos.cuotas + ingresosOtros - suma("GASTO"),
    comprobantes: gastos.filter((g) => g.archivoId).length,
    gastosPorConcepto: [...porConcepto]
      .map(([clave, monto]) => ({ clave, concepto: nombreDelConcepto(clave), monto }))
      .sort((a, b) => b.monto - a.monto),
  };
}

const CLAVES_QUE_IDENTIFICAN = /vivienda|casa|lote|manzana|predio|dni|nombre|titular|residente|vecino/i;

/**
 * El balance agregado (HU-COB-14 CA2) lleva solo totales del periodo: si en algún nivel aparece una clave que apunte a una casa o a
 * una persona, se rechaza antes de entregarlo. Es la garantía de que ningún filtro del vecino baja a un lote.
 */
export function garantizarNoIdentificacion(valor: unknown): void {
  if (Array.isArray(valor)) return valor.forEach(garantizarNoIdentificacion);
  if (valor && typeof valor === "object") {
    for (const [clave, interior] of Object.entries(valor)) {
      if (CLAVES_QUE_IDENTIFICAN.test(clave)) {
        throw new Error("El balance agregado no puede identificar a una casa o a una persona.");
      }
      garantizarNoIdentificacion(interior);
    }
  }
}
