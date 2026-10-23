// @HU-COB-12
// Recibo digital oficial (HU-COB-12): cómo se numera y se verifica, y las franjas en que la directiva lleva el recibo en
// papel. El dominio no sabe de la BD ni de PDF.
import { createHash } from "node:crypto";

export const MAXIMO_NOTA_PEDIDO = 300;

/** El número del recibo como se imprime: seis cifras, «000321». */
export const numeroDeRecibo = (numero: number) => String(numero).padStart(6, "0");

/** El número del pedido de un recibo en papel: «R-008». */
export const numeroDePedido = (numero: number) => `R-${String(numero).padStart(3, "0")}`;

/**
 * El código para verificar un recibo: su número y cuatro letras o cifras que salen de lo que no cambia (el número, el
 * pago y el monto). No se guarda: se vuelve a calcular y, si el recibo se alterara, ya no coincidiría.
 */
export function codigoDeVerificacion(numero: number, pagoId: string, monto: number) {
  const huella = createHash("sha256").update(`${numero}|${pagoId}|${monto}`).digest("hex").slice(0, 4);
  return `JV-${numeroDeRecibo(numero)}-${huella.toUpperCase()}`;
}

export const FRANJAS_DE_VISITA = ["MANANA", "TARDE", "NOCHE"] as const;
export type FranjaDeVisita = (typeof FRANJAS_DE_VISITA)[number];

/** `etiqueta` y `detalle` son lo que elige la vecina; `resumen` es cómo se dice en el pedido ya enviado. */
export const FRANJAS: Record<FranjaDeVisita, { etiqueta: string; detalle: string; resumen: string }> = {
  MANANA: {
    etiqueta: "En la mañana",
    detalle: "De 8:00 a. m. a 12:00 m.",
    resumen: "Mañana, de 8:00 a. m. a 12:00 m.",
  },
  TARDE: {
    etiqueta: "En la tarde",
    detalle: "De 2:00 p. m. a 6:00 p. m.",
    resumen: "Tarde, de 2:00 p. m. a 6:00 p. m.",
  },
  NOCHE: {
    etiqueta: "En la noche",
    detalle: "De 6:00 p. m. a 8:00 p. m.",
    resumen: "Noche, de 6:00 p. m. a 8:00 p. m.",
  },
};

/** Revisa lo que escribe la vecina al pedir su recibo en papel: el recibo y la franja son obligatorios. */
export function prepararPedidoDeRecibo(datos: { reciboId: string; franja: string; nota: string }) {
  const errores: Record<string, string> = {};
  const franja = FRANJAS_DE_VISITA.find((f) => f === datos.franja);
  const nota = datos.nota.trim();
  if (!datos.reciboId) errores.reciboId = "Elija qué recibo necesita.";
  if (!franja) errores.franja = "Elija a qué hora le queda mejor que vayan.";
  if (nota.length > MAXIMO_NOTA_PEDIDO) {
    errores.nota = `La nota puede tener hasta ${MAXIMO_NOTA_PEDIDO} letras. Hágala más corta.`;
  }
  if (Object.keys(errores).length || !franja) return { errores, pedido: null };
  return { errores, pedido: { reciboId: datos.reciboId, franja, nota: nota || null } };
}
