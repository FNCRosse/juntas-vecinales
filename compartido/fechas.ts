// Fechas en UTC en la BD y mostradas en America/Lima, en palabras (docs/ACCESIBILIDAD.md §5).

const ZONA = "America/Lima";

/** "3:00 p. m.", con espacios normales (Intl usa espacios que no se parten). */
export const horaCorta = (fecha: Date) =>
  new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, timeStyle: "short", hour12: true })
    .format(fecha)
    .replace(/[\u00a0\u202f]/g, " ");

/** "Domingo 27 de setiembre de 2026" */
export function fechaLarga(fecha: Date) {
  const texto = new Intl.DateTimeFormat("es-PE", {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(fecha)
    .replace(",", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Buenos días", "Buenas tardes" o "Buenas noches", según la hora de Lima. */
export function saludo(ahora: Date) {
  const hora = Number(
    new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, hour: "numeric", hourCycle: "h23" }).format(ahora),
  );
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Primer nombre para el saludo: "Ana Flores" → "Ana". */
export const primerNombre = (nombreCompleto: string) => nombreCompleto.trim().split(/\s+/)[0] ?? "";

/** "5 de octubre de 2026 a las 11:10 a. m." */
export function fechaYHora(fecha: Date) {
  const dia = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, dateStyle: "long" }).format(fecha);
  return `${dia} a las ${horaCorta(fecha)}`;
}

/** "Sábado 3 de octubre, de 3:00 p. m. a 6:00 p. m.": el horario de una visita, en Lima. */
export function rangoHorario(desde: Date, hasta: Date) {
  const dia = fechaLarga(desde).replace(/ de \d{4}$/, "");
  return `${dia}, de ${horaCorta(desde)} a ${horaCorta(hasta)}`;
}

/** Fecha y hora de un formulario (en Lima, UTC−5 todo el año) a un instante en UTC. */
export function desdeHoraDeLima(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00-05:00`);
}

/** Las 0:00 de hoy en Lima, en UTC: desde ahí se cuentan "las entradas de hoy". */
export function inicioDelDiaEnLima(ahora: Date) {
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(ahora);
  return new Date(`${dia}T00:00:00-05:00`);
}
