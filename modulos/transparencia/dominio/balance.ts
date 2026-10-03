// @HU-ASA-10
// BalanceFinanciero y Egreso del diagrama 02e: lo que una actividad pro fondos recaudó y gastó. Todo en
// céntimos enteros; la utilidad neta se calcula y puede ser negativa. Mientras M4 no exista, la actividad
// se identifica por su nombre y fecha.
import { desdeHoraDeLima } from "@/compartido/fechas";

export const MAXIMO_TITULO = 120;
export const MAXIMO_CONCEPTO = 80;
export const MAXIMO_EGRESOS = 50;
/** S/ 1 000 000: un tope para que un error de tipeo no publique un balance absurdo. */
export const MAXIMO_MONTO = 100_000_000;

export type DatosBalance = {
  titulo: string;
  /** Día de la actividad, "AAAA-MM-DD" en Lima. */
  fechaActividad: string;
  ingresosVirtuales: number;
  ingresosEnPuerta: number;
  egresos: { concepto: string; monto: number; archivoId: string }[];
};

const hoyEnLima = (ahora: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(ahora);

const esFechaReal = (fecha: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(fecha) && new Date(`${fecha}T00:00:00Z`).toISOString().startsWith(fecha);

const esMontoValido = (monto: number) => Number.isInteger(monto) && monto >= 0 && monto <= MAXIMO_MONTO;
const MENSAJE_MONTO = "Escriba un monto en soles, por ejemplo 150.50.";

/** Revisa y limpia el balance. Los errores de un gasto llevan su posición: `egresos.0.monto`. */
export function prepararBalance(datos: DatosBalance, ahora: Date) {
  const errores: Record<string, string> = {};
  const titulo = datos.titulo.trim();
  if (!titulo) errores.titulo = "Escriba el nombre de la actividad.";
  else if (titulo.length > MAXIMO_TITULO) {
    errores.titulo = `El nombre puede tener hasta ${MAXIMO_TITULO} letras. Hágalo más corto.`;
  }
  if (!esFechaReal(datos.fechaActividad)) errores.fechaActividad = "Elija la fecha de la actividad.";
  else if (datos.fechaActividad > hoyEnLima(ahora)) {
    errores.fechaActividad = "La fecha de la actividad no puede ser futura.";
  }
  if (!esMontoValido(datos.ingresosVirtuales)) errores.ingresosVirtuales = MENSAJE_MONTO;
  if (!esMontoValido(datos.ingresosEnPuerta)) errores.ingresosEnPuerta = MENSAJE_MONTO;

  if (datos.egresos.length > MAXIMO_EGRESOS) {
    errores.egresos = `Puede registrar hasta ${MAXIMO_EGRESOS} gastos por balance.`;
  }
  const egresos = datos.egresos.map((e, i) => {
    const concepto = e.concepto.trim();
    if (!concepto) errores[`egresos.${i}.concepto`] = "Escriba en qué se gastó.";
    else if (concepto.length > MAXIMO_CONCEPTO) {
      errores[`egresos.${i}.concepto`] = `Puede escribir hasta ${MAXIMO_CONCEPTO} letras. Hágalo más corto.`;
    }
    if (!Number.isInteger(e.monto) || e.monto <= 0)
      errores[`egresos.${i}.monto`] = "Escriba cuánto se gastó.";
    else if (e.monto > MAXIMO_MONTO) errores[`egresos.${i}.monto`] = MENSAJE_MONTO;
    if (!e.archivoId) errores[`egresos.${i}.archivoId`] = "Adjunte la foto del comprobante de este gasto.";
    return { concepto, monto: e.monto, archivoId: e.archivoId };
  });

  const hayMovimientos = datos.ingresosVirtuales + datos.ingresosEnPuerta > 0 || egresos.length > 0;
  if (!hayMovimientos && !errores.ingresosVirtuales && !errores.ingresosEnPuerta) {
    errores.movimientos = "Registre al menos un ingreso o un gasto.";
  }
  const fecha = esFechaReal(datos.fechaActividad)
    ? desdeHoraDeLima(datos.fechaActividad, "12:00")
    : new Date(NaN);
  return {
    errores,
    balance: {
      titulo,
      fechaActividad: fecha,
      ingresosVirtuales: datos.ingresosVirtuales,
      ingresosEnPuerta: datos.ingresosEnPuerta,
      egresos,
    },
  };
}

/** Ingresos, egresos y utilidad neta: lo que dibuja el gráfico y lo que dice su tabla equivalente. */
export function calcularTotales(balance: {
  ingresosVirtuales: number;
  ingresosEnPuerta: number;
  egresos: { monto: number }[];
}) {
  const ingresos = balance.ingresosVirtuales + balance.ingresosEnPuerta;
  const egresos = balance.egresos.reduce((suma, e) => suma + e.monto, 0);
  return { ingresos, egresos, utilidadNeta: ingresos - egresos };
}
