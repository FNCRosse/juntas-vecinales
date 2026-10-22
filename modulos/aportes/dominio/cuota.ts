// @HU-COB-01
// Cuota semanal de una casa (diagrama 02b): el ciclo va de lunes a domingo en America/Lima y la cuota de la semana se
// genera el lunes con lo que hay en el predio. El dominio calcula el monto y dice qué semanas faltan por emitir; no
// sabe de la BD. Montos en céntimos enteros.
import { desdeHoraDeLima } from "@/compartido/fechas";
import type { Concepto, UnidadCobro } from "./tarifa";

/**
 * Cuántas semanas atrás se recuperan si el worker no corrió (una caída larga): las más recientes. Un tope razonable,
 * no una regla de la junta: pasar de ahí sería inventar deuda de muchos meses.
 */
export const MAXIMO_RECUPERACION = 8;

const DIA = 86_400_000;
const mediodia = (dia: string) => new Date(`${dia}T12:00:00Z`);
const diaDe = (fecha: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);

export const sumarDias = (dia: string, n: number) =>
  new Date(mediodia(dia).getTime() + n * DIA).toISOString().slice(0, 10);

/** El lunes de la semana de una fecha, en hora de Lima: «AAAA-MM-DD» (el mismo día si ya es lunes). */
export function lunesDe(fecha: Date) {
  const dia = diaDe(fecha);
  const semana = mediodia(dia).getUTCDay();
  return sumarDias(dia, -((semana + 6) % 7));
}

/** El instante en que empieza la semana de ese lunes: las 0:00 de Lima. */
export const inicioDeSemana = (lunes: string) => desdeHoraDeLima(lunes, "00:00");

/** La fecha límite de pago: el domingo de esa semana, hasta las 11:59 p. m. de Lima. */
export const fechaLimiteDe = (lunes: string) => new Date(`${sumarDias(lunes, 6)}T23:59:59-05:00`);

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const diaYMes = (dia: string) => ({ dia: Number(dia.slice(8)), mes: MESES[Number(dia.slice(5, 7)) - 1] });

/** «Semana del 7 al 13 de setiembre» o, si cruza de mes, «Semana del 28 de setiembre al 4 de octubre». */
export function etiquetaDeSemana(lunes: string) {
  const desde = diaYMes(lunes);
  const hasta = diaYMes(sumarDias(lunes, 6));
  return desde.mes === hasta.mes
    ? `Semana del ${desde.dia} al ${hasta.dia} de ${hasta.mes}`
    : `Semana del ${desde.dia} de ${desde.mes} al ${hasta.dia} de ${hasta.mes}`;
}

/**
 * Las semanas que faltan por emitir para una casa, de la más antigua a la actual: desde la siguiente a su última cuota
 * (o solo la actual si no tiene ninguna) hasta la semana actual. Sin nada que emitir devuelve una lista vacía, así la
 * tarea puede correr varias veces sin duplicar. Si pasó mucho tiempo, solo las últimas `MAXIMO_RECUPERACION`.
 */
export function periodosPorEmitir(ultimo: string | null, actual: string) {
  if (!ultimo) return [actual];
  const faltan: string[] = [];
  for (let semana = sumarDias(ultimo, 7); semana <= actual; semana = sumarDias(semana, 7))
    faltan.push(semana);
  return faltan.slice(-MAXIMO_RECUPERACION);
}

export type Linea = {
  clave: string;
  nombre: string;
  unidad: UnidadCobro;
  montoUnitario: number;
  cantidad: number;
  subtotal: number;
};

/**
 * La cuota de una casa (HU-COB-01 CA1): Σ monto del concepto × cantidad que hay en el predio. `ocupacion` dice cuántas
 * unidades hay de cada concepto por su clave («auto»: 2); un concepto sin unidades no aparece. Un concepto que la
 * asamblea agregó después todavía no tiene dónde registrarse en el padrón, así que no suma.
 */
export function calcularCuota(conceptos: Concepto[], ocupacion: Record<string, number>) {
  const lineas: Linea[] = conceptos
    .map((c) => {
      const cantidad = ocupacion[c.clave] ?? 0;
      return {
        clave: c.clave,
        nombre: c.nombre,
        unidad: c.unidad,
        montoUnitario: c.monto,
        cantidad,
        subtotal: c.monto * cantidad,
      };
    })
    .filter((l) => l.cantidad > 0);
  return { lineas, total: lineas.reduce((suma, l) => suma + l.subtotal, 0) };
}

/**
 * Aplica un abono a una cuota (HU-COB-09): baja el saldo, nunca por debajo de cero. Si ya no falta nada, queda
 * pagada; si es una parte, queda el saldo y la cuota sigue como estaba (pendiente, vencida o en discrepancia).
 */
export function aplicarAbono(
  saldo: number,
  abono: number,
  estado: "PENDIENTE" | "VENCIDA" | "EN_DISCREPANCIA",
) {
  const nuevo = Math.max(0, saldo - abono);
  return { saldo: nuevo, estado: nuevo === 0 ? ("PAGADA" as const) : estado };
}
