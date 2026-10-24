// @HU-COB-08
// Pago de la cuota (diagrama 02b): cuánto puede pagar una casa de lo que debe y cómo se numera la constancia de envío.
// El dominio solo arma las opciones; no sabe de la BD ni de los archivos. Montos en céntimos enteros.
import { sumarDias } from "./cuota";

export const MEDIOS = {
  YAPE_O_PLIN: "Yape o Plin",
  TRANSFERENCIA: "Transferencia bancaria",
  EFECTIVO: "Efectivo, en su casa",
} as const;
export type MedioDigital = "YAPE_O_PLIN" | "TRANSFERENCIA";
/** Los medios con comprobante (HU-COB-08); el efectivo lo cobra la directiva en la casa (HU-COB-11). */
export const MEDIOS_DIGITALES: MedioDigital[] = ["YAPE_O_PLIN", "TRANSFERENCIA"];

export type CuotaPorPagar = { id: string; periodo: string; saldo: number };
export type OpcionDePago = {
  semanas: number;
  monto: number;
  titulo: string;
  detalle: string;
  cuotaIds: string[];
};

/** Cuántas semanas se ofrecen además de «todo lo pendiente»: las primeras, para no listar una opción por semana. */
const SEMANAS_OFRECIDAS = [1, 2, 3, 4, 8];

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

/** «del 7 al 27 de setiembre» (o «del 28 de setiembre al 18 de octubre»): desde el lunes de la primera semana hasta el domingo de la última. */
export function rangoDeSemanas(primera: string, ultima: string) {
  const desde = diaYMes(primera);
  const hasta = diaYMes(sumarDias(ultima, 6));
  return desde.mes === hasta.mes
    ? `del ${desde.dia} al ${hasta.dia} de ${hasta.mes}`
    : `del ${desde.dia} de ${desde.mes} al ${hasta.dia} de ${hasta.mes}`;
}

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Lo que la casa puede pagar hoy (VEC-COB-02): todo lo pendiente o solo las primeras semanas, siempre de la más
 * antigua en adelante. `cuotas` va de la más antigua a la más nueva e incluye solo las que todavía no están en un pago.
 */
export function opcionesDePago(cuotas: CuotaPorPagar[]): OpcionDePago[] {
  const total = cuotas.length;
  const cantidades = [...new Set([total, ...SEMANAS_OFRECIDAS.filter((k) => k < total)])]
    .filter((k) => k > 0)
    .sort((a, b) => b - a);
  return cantidades.map((k) => {
    const incluidas = cuotas.slice(0, k);
    const rango = rangoDeSemanas(incluidas[0].periodo, incluidas[k - 1].periodo);
    return {
      semanas: k,
      monto: incluidas.reduce((suma, c) => suma + c.saldo, 0),
      titulo: k === total ? "Todo lo pendiente" : `${k} ${k === 1 ? "semana" : "semanas"}`,
      detalle: k === total ? `${k} ${k === 1 ? "semana" : "semanas"}, ${rango}` : mayuscula(rango),
      cuotaIds: incluidas.map((c) => c.id),
    };
  });
}

/** «E-0917»: la constancia de envío que recibe la casa al mandar su comprobante. */
export const numeroDeConstancia = (numero: number) => `E-${String(numero).padStart(4, "0")}`;
