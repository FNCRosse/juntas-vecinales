// @HU-ASA-11
// ActaDigital del diagrama 02e: lo que la asamblea acordó, a lo que se comprometió la directiva y las
// conclusiones. Se registra con título y fecha hasta que M4 la enlace a su asamblea.
import { desdeHoraDeLima } from "@/compartido/fechas";

export const MAXIMO_TITULO = 120;
export const MAXIMO_ACUERDOS = 4000;
export const MAXIMO_COMPROMISOS = 2000;
export const MAXIMO_CONCLUSIONES = 2000;

export type DatosActa = {
  titulo: string;
  /** Día de la asamblea, "AAAA-MM-DD" en Lima. */
  fechaAsamblea: string;
  /** Un acuerdo por línea. */
  acuerdos: string;
  /** Un compromiso por línea (opcional). */
  compromisos: string;
  conclusiones: string;
};

const porLinea = (texto: string) =>
  texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);

const hoyEnLima = (ahora: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(ahora);

const esFechaReal = (fecha: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(fecha) && new Date(`${fecha}T00:00:00Z`).toISOString().startsWith(fecha);

/** Revisa y limpia los datos del acta. Los mensajes dicen qué hacer, sin términos técnicos. */
export function prepararActa(datos: DatosActa, ahora: Date) {
  const errores: Record<string, string> = {};
  const titulo = datos.titulo.trim();
  const acuerdos = porLinea(datos.acuerdos);
  const compromisos = porLinea(datos.compromisos);
  const conclusiones = datos.conclusiones.trim();

  if (!titulo) errores.titulo = "Escriba el título del acta.";
  else if (titulo.length > MAXIMO_TITULO) {
    errores.titulo = `El título puede tener hasta ${MAXIMO_TITULO} letras. Hágalo más corto.`;
  }
  if (!esFechaReal(datos.fechaAsamblea)) errores.fechaAsamblea = "Elija la fecha de la asamblea.";
  else if (datos.fechaAsamblea > hoyEnLima(ahora)) {
    errores.fechaAsamblea = "La fecha de la asamblea no puede ser futura.";
  }
  if (!acuerdos.length) errores.acuerdos = "Escriba al menos un acuerdo de la asamblea.";
  else if (acuerdos.join("\n").length > MAXIMO_ACUERDOS) {
    errores.acuerdos = `Los acuerdos pueden tener hasta ${MAXIMO_ACUERDOS} letras. Hágalos más cortos.`;
  }
  if (compromisos.join("\n").length > MAXIMO_COMPROMISOS) {
    errores.compromisos = `Los compromisos pueden tener hasta ${MAXIMO_COMPROMISOS} letras. Hágalos más cortos.`;
  }
  if (conclusiones.length > MAXIMO_CONCLUSIONES) {
    errores.conclusiones = `Las conclusiones pueden tener hasta ${MAXIMO_CONCLUSIONES} letras. Hágalas más cortas.`;
  }
  const fecha = esFechaReal(datos.fechaAsamblea)
    ? desdeHoraDeLima(datos.fechaAsamblea, "12:00")
    : new Date(NaN);
  return { errores, acta: { titulo, fechaAsamblea: fecha, acuerdos, compromisos, conclusiones } };
}

/** Nombre del archivo: "acta-asamblea-general-de-octubre.pdf". */
export function nombreDeArchivo(titulo: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `acta-${base || "asamblea"}.pdf`;
}
