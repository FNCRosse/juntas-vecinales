// Fechas en UTC en la BD y mostradas en America/Lima, en palabras (docs/ACCESIBILIDAD.md §5).

const ZONA = "America/Lima";

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
