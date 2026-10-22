// @HU-COB-16
// Tarifa semanal por conceptos que aprueba la asamblea (diagrama 02b). El dominio revisa un cambio, lo aplica sobre
// la lista anterior y ordena las versiones; no sabe de la BD. Montos en céntimos enteros; las fechas de vigencia son
// días de Lima (un lunes) y empiezan a las 0:00 de ese día.
import { soles } from "@/compartido/dinero";
import { desdeHoraDeLima, fechaEnFrase } from "@/compartido/fechas";

export type UnidadCobro = "POR_FAMILIA" | "POR_VEHICULO" | "POR_INQUILINO" | "POR_LOCAL";
export const UNIDADES: readonly UnidadCobro[] = ["POR_FAMILIA", "POR_VEHICULO", "POR_INQUILINO", "POR_LOCAL"];

/** Cómo se dice en la tabla («Se cobra: Por vehículo»). */
export const UNIDAD_EN_TEXTO: Record<UnidadCobro, string> = {
  POR_FAMILIA: "Por familia",
  POR_VEHICULO: "Por vehículo",
  POR_INQUILINO: "Por inquilino",
  POR_LOCAL: "Por local",
};

export type Concepto = { clave: string; nombre: string; unidad: UnidadCobro; monto: number };
export type TipoCambio = "INICIAL" | "AGREGAR" | "CAMBIAR";

export const MAXIMO_NOMBRE = 40;
export const MAXIMO_ACTA = 120;
/** S/ 1,000.00 por semana: un tope para atrapar un monto mal escrito, no una regla de la junta. */
export const MAXIMO_MONTO = 100_000;
const PEDIR_MONTO = "Escriba un monto en soles, por ejemplo 2.50.";

const DIA = 86_400_000;
const diaDeLima = (fecha: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);
const mediodia = (dia: string) => new Date(`${dia}T12:00:00Z`);
const sumarDias = (dia: string, n: number) =>
  new Date(mediodia(dia).getTime() + n * DIA).toISOString().slice(0, 10);
const esDiaReal = (dia: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(dia) && mediodia(dia).toISOString().startsWith(dia);
const esLunes = (dia: string) => mediodia(dia).getUTCDay() === 1;

/** El día de una fecha en Lima, «AAAA-MM-DD». */
export const diaEnLima = diaDeLima;

/** El primer lunes después de hoy (hora de Lima): el siguiente ciclo semanal, «AAAA-MM-DD». */
export function siguienteCiclo(ahora: Date) {
  let dia = sumarDias(diaDeLima(ahora), 1);
  while (!esLunes(dia)) dia = sumarDias(dia, 1);
  return dia;
}

/**
 * Los tres lunes que se ofrecen como vigencia: desde el siguiente ciclo o, si ya hay un cambio programado para
 * después, desde esa fecha (un cambio nuevo no puede regir antes que uno ya programado).
 */
export function opcionesDeVigencia(ahora: Date, ultimaVigencia?: string | null) {
  const primero = siguienteCiclo(ahora);
  const desde = ultimaVigencia && ultimaVigencia > primero ? ultimaVigencia : primero;
  return [0, 1, 2].map((i) => sumarDias(desde, 7 * i));
}

/** «Auto o camioneta» → «auto-o-camioneta»: la clave estable del concepto entre versiones. */
export const claveDe = (nombre: string) =>
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type DatosCambio = {
  /** La clave de un concepto de la lista, o «nuevo». */
  concepto: string;
  nombre?: string;
  unidad?: string;
  /** Céntimos; null si no escribió un monto válido. */
  monto: number | null;
  /** El lunes en que empieza a regir, «AAAA-MM-DD». */
  vigencia: string;
  acta: string;
};

export type Cambio = {
  tipo: "AGREGAR" | "CAMBIAR";
  concepto: Concepto;
  montoAnterior: number | null;
  vigencia: string;
  vigenciaDesde: Date;
  acta: string;
};

/**
 * Revisa un cambio de tarifa (HU-COB-16 CA1 y CA2). `conceptos` es la lista con la que se compara (la de la última
 * versión) y `ultimaVigencia`, el día de esa versión. Los mensajes dicen qué hacer, sin términos técnicos.
 */
export function prepararCambio(
  datos: DatosCambio,
  conceptos: Concepto[],
  ahora: Date,
  ultimaVigencia?: string | null,
) {
  const errores: Record<string, string> = {};
  const acta = datos.acta.trim();
  const nuevo = datos.concepto === "nuevo";
  const actual = nuevo ? undefined : conceptos.find((c) => c.clave === datos.concepto);
  let concepto: Concepto | null = null;

  if (!nuevo && !actual) errores.concepto = "Elija un concepto de la lista.";

  if (nuevo) {
    const nombre = (datos.nombre ?? "").trim();
    const unidad = UNIDADES.find((u) => u === datos.unidad);
    if (!nombre) errores.nombre = "Escriba el nombre del concepto nuevo.";
    else if (nombre.length > MAXIMO_NOMBRE) {
      errores.nombre = `El nombre puede tener hasta ${MAXIMO_NOMBRE} letras. Hágalo más corto.`;
    } else if (!claveDe(nombre) || conceptos.some((c) => c.clave === claveDe(nombre))) {
      errores.nombre = "Ya hay un concepto con ese nombre.";
    }
    if (!unidad) errores.unidad = "Elija cómo se cobra.";
    if (!errores.nombre && !errores.unidad && datos.monto !== null) {
      concepto = { clave: claveDe(nombre), nombre, unidad: unidad!, monto: datos.monto };
    }
  }

  const montoValido = Number.isInteger(datos.monto) && datos.monto! > 0;
  if (!montoValido) errores.monto = PEDIR_MONTO;
  else if (datos.monto! > MAXIMO_MONTO) {
    errores.monto = `El monto es muy alto: el máximo por semana es ${soles(MAXIMO_MONTO)}. Revíselo.`;
  } else if (actual && datos.monto === actual.monto) {
    errores.monto = "Es el mismo monto de hoy. Escriba el monto nuevo que aprobó la asamblea.";
  }

  const primerCiclo = siguienteCiclo(ahora);
  const minimo = ultimaVigencia && ultimaVigencia > primerCiclo ? ultimaVigencia : primerCiclo;
  if (!esDiaReal(datos.vigencia)) errores.vigencia = "Elija desde cuándo rige.";
  else if (!esLunes(datos.vigencia)) {
    errores.vigencia = "La tarifa cambia los lunes, cuando empieza la semana. Elija un lunes.";
  } else if (datos.vigencia < minimo) {
    errores.vigencia =
      minimo === primerCiclo
        ? `Solo rige desde el siguiente ciclo semanal en adelante: el ${fechaEnFrase(desdeHoraDeLima(minimo, "12:00"))}.`
        : `Ya hay un cambio programado desde el ${fechaEnFrase(desdeHoraDeLima(minimo, "12:00"))}. Elija esa fecha o una posterior.`;
  }

  if (!acta) errores.acta = "Escriba el acta de asamblea que lo aprobó.";
  else if (acta.length > MAXIMO_ACTA) {
    errores.acta = `El acta puede tener hasta ${MAXIMO_ACTA} letras. Hágala más corta.`;
  }

  if (actual && montoValido) concepto = { ...actual, monto: datos.monto! };
  if (Object.keys(errores).length || !concepto) return { errores, cambio: null };
  const cambio: Cambio = {
    tipo: nuevo ? "AGREGAR" : "CAMBIAR",
    concepto,
    montoAnterior: actual?.monto ?? null,
    vigencia: datos.vigencia,
    vigenciaDesde: desdeHoraDeLima(datos.vigencia, "00:00"),
    acta,
  };
  return { errores, cambio };
}

/** La lista de conceptos con el cambio aplicado; la anterior no se toca. */
export function aplicarCambio(conceptos: Concepto[], cambio: Cambio): Concepto[] {
  return cambio.tipo === "CAMBIAR"
    ? conceptos.map((c) => (c.clave === cambio.concepto.clave ? { ...cambio.concepto } : { ...c }))
    : [...conceptos.map((c) => ({ ...c })), { ...cambio.concepto }];
}

/** Cómo se lee un cambio en el historial: «Negocio: de S/ 2.50 a S/ 3.00» o «Se agregó Moto: S/ 1.00 por vehículo». */
export function textoDelCambio(c: {
  tipo: "AGREGAR" | "CAMBIAR";
  nombre: string;
  unidad: UnidadCobro;
  montoAnterior: number | null;
  montoNuevo: number;
}) {
  return c.tipo === "CAMBIAR"
    ? `${c.nombre}: de ${soles(c.montoAnterior ?? 0)} a ${soles(c.montoNuevo)}`
    : `Se agregó ${c.nombre}: ${soles(c.montoNuevo)} ${UNIDAD_EN_TEXTO[c.unidad].toLowerCase()}`;
}

/**
 * Ordena las versiones (por vigencia y, a igual vigencia, por orden de registro) y separa la vigente, que es la
 * última cuya vigencia ya llegó, de las programadas, que rigen después.
 */
export function separarVersiones<T extends { vigenciaDesde: Date; creadaEn: Date }>(
  versiones: T[],
  ahora: Date,
) {
  const orden = [...versiones].sort(
    (a, b) =>
      a.vigenciaDesde.getTime() - b.vigenciaDesde.getTime() || a.creadaEn.getTime() - b.creadaEn.getTime(),
  );
  const vigentes = orden.filter((v) => v.vigenciaDesde <= ahora);
  return { vigente: vigentes.at(-1) ?? null, programadas: orden.filter((v) => v.vigenciaDesde > ahora) };
}
