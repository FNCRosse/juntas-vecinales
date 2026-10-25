// @HU-COB-15
// El archivo de la exportación de la recaudación (ExportacionContable, diagrama 02e): un CSV de texto, con los mismos totales y
// desgloses del tablero (HU-COB-13). El dominio solo arma el texto; no sabe de la BD. Montos en céntimos enteros.

/** Marca de orden de bytes: con ella Excel lee las tildes y la ñ del UTF-8 en vez de caracteres raros. */
export const BOM = "﻿";

/** Los montos salen en soles con dos decimales y punto: «1840.00». */
export const montoCsv = (centimos: number) => (centimos / 100).toFixed(2);

/**
 * Una celda del CSV. Va entre comillas si tiene coma, comillas o salto de línea; y si empieza como una fórmula de la hoja de
 * cálculo (= + - @), se le antepone un apóstrofo para que no se ejecute al abrirla.
 */
export function celdaCsv(valor: string | number) {
  if (typeof valor === "number") return String(valor);
  const texto = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export const nombreDeArchivo = (desde: string, hasta: string) => `recaudacion-${desde}-a-${hasta}.csv`;

const ESTADOS = [
  ["AL_DIA", "Al día"],
  ["ATRASO", "Atraso de 1 a 7 semanas"],
  ["CRITICO", "8 semanas o más"],
] as const;
type Estado = (typeof ESTADOS)[number][0];

export type DatosDeExportacion = {
  /** Cuándo se generó, ya en hora de Lima: «2026-09-27 15:00». */
  generado: string;
  periodo: { desde: string; hasta: string };
  /** El estado de las casas que se pidió, con sus palabras: «Todas las casas». */
  estado: string;
  tablero: {
    seCobro: number;
    recibos: number;
    digital: { monto: number; cantidad: number };
    efectivo: { monto: number; cantidad: number };
    faltaCobrar: { monto: number; cuotas: number };
    cuadra: { ok: boolean };
    semanas: { etiqueta: string; digital: number; efectivo: number; total: number }[];
  };
  casas: { vivienda: string; estado: Estado; recibos: number; cobrado: number; debe: number }[];
};

const suma = (numeros: number[]) => numeros.reduce((total, n) => total + n, 0);

/** El CSV completo: resumen, por semana, por estado de las casas y por casa. Las líneas terminan en CRLF, como lo espera Excel. */
export function csvDeRecaudacion(d: DatosDeExportacion) {
  const t = d.tablero;
  const filas: (string | number)[][] = [
    ["Recaudación de la cuota de vigilancia"],
    ["Periodo", `${d.periodo.desde} a ${d.periodo.hasta}`],
    ["Estado de las casas", d.estado],
    ["Generado el", d.generado],
    [],
    ["Resumen"],
    ["Concepto", "Valor"],
    ["Total cobrado (S/)", montoCsv(t.seCobro)],
    ["Recibos emitidos", t.recibos],
    ["Recibos digitales", t.digital.cantidad],
    ["Monto digital (S/)", montoCsv(t.digital.monto)],
    ["Recibos en efectivo", t.efectivo.cantidad],
    ["Monto en efectivo (S/)", montoCsv(t.efectivo.monto)],
    ["Falta cobrar (S/)", montoCsv(t.faltaCobrar.monto)],
    ["Cuotas por cobrar", t.faltaCobrar.cuotas],
    ["¿Cuadra?", t.cuadra.ok ? "Sí" : "No"],
    [],
    ["Por semana"],
    ["Semana", "Digital (S/)", "En efectivo (S/)", "Total (S/)"],
    ...t.semanas.map((s) => [s.etiqueta, montoCsv(s.digital), montoCsv(s.efectivo), montoCsv(s.total)]),
    ["Total", montoCsv(t.digital.monto), montoCsv(t.efectivo.monto), montoCsv(t.seCobro)],
    [],
    ["Por estado de las casas"],
    ["Estado", "Casas", "Recibos", "Cobrado (S/)", "Debe (S/)"],
    ...ESTADOS.map(([clave, etiqueta]) => {
      const casas = d.casas.filter((c) => c.estado === clave);
      return [
        etiqueta,
        casas.length,
        suma(casas.map((c) => c.recibos)),
        montoCsv(suma(casas.map((c) => c.cobrado))),
        montoCsv(suma(casas.map((c) => c.debe))),
      ];
    }),
    [],
    ["Por casa"],
    ["Vivienda", "Estado", "Recibos", "Cobrado (S/)", "Debe (S/)"],
    ...d.casas.map((c) => [
      c.vivienda,
      ESTADOS.find(([clave]) => clave === c.estado)![1],
      c.recibos,
      montoCsv(c.cobrado),
      montoCsv(c.debe),
    ]),
  ];
  return filas.map((fila) => fila.map(celdaCsv).join(",")).join("\r\n") + "\r\n";
}
