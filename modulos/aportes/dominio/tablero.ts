// @HU-COB-13
// Tablero de recaudación (TableroRecaudacion, diagrama 02b): qué se pide mirar (un rango de fechas y el estado de las casas) y
// cómo se suman los recibos. El dominio no sabe de la BD. Montos en céntimos enteros; los días, «AAAA-MM-DD» en hora de Lima.
import { fechaCorta } from "@/compartido/fechas";
import { etiquetaDeSemana, lunesDe, sumarDias } from "./cuota";
import type { EstadoMorosidad } from "./morosidad";

export type FiltroDeEstado = "TODAS" | "AL_DIA" | "ATRASO" | "CRITICO";

/** El estado de las casas con las palabras del prototipo. */
export const FILTROS_DE_ESTADO: { valor: FiltroDeEstado; etiqueta: string }[] = [
  { valor: "TODAS", etiqueta: "Todas las casas" },
  { valor: "AL_DIA", etiqueta: "Al día" },
  { valor: "ATRASO", etiqueta: "Atraso de 1 a 7 semanas" },
  { valor: "CRITICO", etiqueta: "8 semanas o más" },
];

export const filtroDeMorosidad = (estado: EstadoMorosidad): Exclude<FiltroDeEstado, "TODAS"> =>
  estado === "SOLVENTE" ? "AL_DIA" : estado === "MOROSO_PREVENTIVO" ? "ATRASO" : "CRITICO";

const MAXIMO_DIAS = 366;
const DIA = 86_400_000;
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

const esDia = (texto: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(texto) && new Date(`${texto}T12:00:00Z`).toISOString().slice(0, 10) === texto;
const mediodia = (dia: string) => new Date(`${dia}T12:00:00-05:00`);
const diasEntre = (desde: string, hasta: string) =>
  Math.round((new Date(`${hasta}T12:00:00Z`).getTime() - new Date(`${desde}T12:00:00Z`).getTime()) / DIA);

/** Revisa lo que se pide mirar. Sin nada, el mes en curso hasta hoy y todas las casas. */
export function prepararConsulta(datos: { desde?: string; hasta?: string; estado?: string }, hoy: string) {
  const errores: Record<string, string> = {};
  const desde = datos.desde || `${hoy.slice(0, 8)}01`;
  const hasta = datos.hasta || hoy;
  const estado = FILTROS_DE_ESTADO.find((f) => f.valor === (datos.estado || "TODAS"))?.valor;
  if (!esDia(desde)) errores.desde = "Escriba la fecha como 2026-07-01.";
  if (!esDia(hasta)) errores.hasta = "Escriba la fecha como 2026-07-01.";
  if (!estado) errores.estado = "Elija un estado de la lista.";
  if (!errores.desde && !errores.hasta) {
    if (hasta < desde) errores.hasta = "La fecha final no puede ser antes de la inicial.";
    else if (diasEntre(desde, hasta) > MAXIMO_DIAS) errores.hasta = "Elija un rango de hasta un año.";
  }
  if (Object.keys(errores).length || !estado) return { errores, consulta: null };
  return { errores, consulta: { desde, hasta, estado } };
}

export type Periodo = { valor: string; etiqueta: string; desde: string; hasta: string };

const mesAnterior = (mes: string) => {
  const dia = sumarDias(`${mes}-01`, -1);
  return dia.slice(0, 7);
};
const finDelMes = (mes: string) => sumarDias(sumarDias(`${mes}-28`, 4).slice(0, 8) + "01", -1);
const etiquetaDelMes = (mes: string) => {
  const nombre = MESES[Number(mes.slice(5)) - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${mes.slice(0, 4)}`;
};

/** Los periodos que ofrece la lista: los tres últimos meses y el rango de los tres juntos hasta hoy. */
export function periodosPredefinidos(hoy: string): Periodo[] {
  const meses = [hoy.slice(0, 7)];
  for (let i = 0; i < 2; i++) meses.push(mesAnterior(meses[i]));
  const desde = `${meses[2]}-01`;
  return [
    ...meses.map((mes) => ({
      valor: mes,
      etiqueta: etiquetaDelMes(mes),
      desde: `${mes}-01`,
      hasta: finDelMes(mes),
    })),
    {
      valor: "tres-meses",
      etiqueta: `Del ${fechaCorta(mediodia(desde)).replace(/ de \d{4}$/, "")} al ${fechaCorta(mediodia(hoy))}`,
      desde,
      hasta: hoy,
    },
  ];
}

/** El periodo que se eligió en la lista; si no es ninguno, el mes en curso. */
export function resolverPeriodo(valor: string | undefined, hoy: string) {
  const periodos = periodosPredefinidos(hoy);
  return periodos.find((p) => p.valor === valor) ?? periodos[0];
}

export type ReciboDelPeriodo = { monto: number; fecha: Date; digital: boolean };

/**
 * Suma los recibos emitidos: lo cobrado en total, por medio (digital o en efectivo) y por semana de lunes a domingo en hora de
 * Lima. Incluye las semanas sin cobros, para que la tabla sea continua.
 */
export function consolidar(recibos: ReciboDelPeriodo[], desde: string, hasta: string) {
  const semanas = new Map<string, { digital: number; efectivo: number }>();
  for (let lunes = lunesDe(mediodia(desde)); lunes <= hasta; lunes = sumarDias(lunes, 7)) {
    semanas.set(lunes, { digital: 0, efectivo: 0 });
  }
  const digital = { monto: 0, cantidad: 0 };
  const efectivo = { monto: 0, cantidad: 0 };
  for (const r of recibos) {
    const medio = r.digital ? digital : efectivo;
    medio.monto += r.monto;
    medio.cantidad += 1;
    const lunes = lunesDe(r.fecha);
    const semana = semanas.get(lunes) ?? { digital: 0, efectivo: 0 };
    semana[r.digital ? "digital" : "efectivo"] += r.monto;
    semanas.set(lunes, semana);
  }
  return {
    total: digital.monto + efectivo.monto,
    cantidad: digital.cantidad + efectivo.cantidad,
    digital,
    efectivo,
    semanas: [...semanas]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([inicio, s]) => ({
        inicio,
        etiqueta: etiquetaDeSemana(inicio),
        digital: s.digital,
        efectivo: s.efectivo,
        total: s.digital + s.efectivo,
      })),
  };
}

/** «Cuadra» cuando todas las cuentas dan lo mismo, al céntimo (CA3). */
export const cuadra = (...montos: number[]) => montos.every((monto) => monto === montos[0]);
