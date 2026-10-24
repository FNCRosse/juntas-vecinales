// @HU-COB-11
// Cobro en efectivo (HU-COB-11): cómo se reparte lo que recibe la directiva entre las cuotas de una casa y qué se le pide a
// quien lo pide o lo registra. El dominio no sabe de la BD ni del teléfono. Montos en céntimos enteros.
import { FRANJAS_DE_VISITA, MAXIMO_NOTA_PEDIDO, type FranjaDeVisita } from "./recibo";

/** El número del pedido de cobro en casa: «C-021». */
export const numeroDePedidoDeCobro = (numero: number) => `C-${String(numero).padStart(3, "0")}`;

/**
 * Reparte lo recibido entre las cuotas por pagar, de la más antigua a la más nueva, sin pasar del saldo de cada una.
 * Lo que no cabe (la casa ya no debía tanto cuando el cobro llegó al servidor) es excedente: el dinero se recibió y no se
 * pierde, queda dicho para que la directiva lo devuelva o lo consulte.
 */
export function repartirCobro(monto: number, cuotas: { id: string; saldo: number }[]) {
  let resto = monto;
  const partes: { cuotaId: string; monto: number }[] = [];
  for (const cuota of cuotas) {
    if (resto <= 0) break;
    const abono = Math.min(resto, cuota.saldo);
    if (abono > 0) partes.push({ cuotaId: cuota.id, monto: abono });
    resto -= Math.max(abono, 0);
  }
  return { partes, aplicado: monto - resto, excedente: resto };
}

/** Revisa el pedido de la casa para que le cobren en su domicilio: cuánto (semanas) y a qué hora; la nota es opcional. */
export function prepararPedidoDeCobro(datos: { semanas: number; franja: string; nota: string }) {
  const errores: Record<string, string> = {};
  const franja = FRANJAS_DE_VISITA.find((f) => f === datos.franja);
  const nota = datos.nota.trim();
  if (!Number.isInteger(datos.semanas) || datos.semanas < 1) errores.semanas = "Elija cuánto va a pagar.";
  if (!franja) errores.franja = "Elija a qué hora le queda mejor que vayan.";
  if (nota.length > MAXIMO_NOTA_PEDIDO) {
    errores.nota = `La nota puede tener hasta ${MAXIMO_NOTA_PEDIDO} letras. Hágala más corta.`;
  }
  if (Object.keys(errores).length || !franja) return { errores, pedido: null };
  return {
    errores,
    pedido: { semanas: datos.semanas, franja: franja as FranjaDeVisita, nota: nota || null },
  };
}

/** Cómo pagó la casa su deuda acumulada (DIR-COB-16): en efectivo o por Yape, Plin o transferencia. */
export const MEDIOS_DE_LIQUIDACION = ["EFECTIVO", "YAPE_O_PLIN", "TRANSFERENCIA"] as const;
export type MedioDeLiquidacion = (typeof MEDIOS_DE_LIQUIDACION)[number];
export const MAXIMO_NUMERO_OPERACION = 30;

/** Revisa cómo pagó y, si lo tiene, el número de operación (opcional; solo para quien pagó por Yape, Plin o transferencia). */
export function prepararLiquidacion(datos: { medio: string; numeroOperacion: string }) {
  const errores: Record<string, string> = {};
  const medio = MEDIOS_DE_LIQUIDACION.find((m) => m === datos.medio);
  const numeroOperacion = datos.numeroOperacion.trim();
  if (!medio) errores.medio = "Elija cómo pagó.";
  if (numeroOperacion.length > MAXIMO_NUMERO_OPERACION) {
    errores.numeroOperacion = `El número de operación puede tener hasta ${MAXIMO_NUMERO_OPERACION} letras o cifras.`;
  }
  if (Object.keys(errores).length || !medio) return { errores, liquidacion: null };
  return { errores, liquidacion: { medio, numeroOperacion: numeroOperacion || null } };
}

/** El monto que recibió la directiva: céntimos enteros y más de cero. */
export function validarMontoCobrado(monto: number) {
  return Number.isInteger(monto) && monto > 0 ? null : "Escriba cuánto recibió, mayor que cero.";
}

/**
 * Cuándo se recibió el dinero: la hora que anotó el teléfono, que puede llegar mucho después si no había señal. Si viene
 * mal escrita o del futuro (reloj descompuesto), vale la hora en que llegó.
 */
export function fechaDelCobro(registradoEn: string | undefined, ahora: Date) {
  const fecha = registradoEn ? new Date(registradoEn) : null;
  return fecha && !Number.isNaN(fecha.getTime()) && fecha <= ahora ? fecha : ahora;
}
