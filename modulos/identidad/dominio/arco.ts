// @HU-GAR-12 @HU-GAR-13 @HU-GAR-16
// SolicitudARCO del diagrama 02a: plazos de la Ley N.° 29733 (D. S. 016-2024-JUS), contados en días
// hábiles de lunes a viernes en Lima (docs/DATOS.md §6).

export type TipoArco = "ACCESO" | "RECTIFICACION" | "CANCELACION" | "OPOSICION";
export type CampoRectificable = "NOMBRE" | "DNI" | "DIRECCION";

export const PLAZO_DIAS_HABILES: Record<TipoArco, number> = {
  ACCESO: 20,
  RECTIFICACION: 10,
  CANCELACION: 10,
  OPOSICION: 10,
};

/** Desde cuántos días hábiles antes del vencimiento se alerta en la bandeja (HU-GAR-16 CA2). */
export const DIAS_DE_ALERTA = 2;

export const TIPOS_ARCO: Record<TipoArco, string> = {
  ACCESO: "Acceso",
  RECTIFICACION: "Rectificación",
  CANCELACION: "Cancelación",
  OPOSICION: "Oposición",
};

export const CAMPOS: Record<CampoRectificable, { opcion: string; nombre: string }> = {
  NOMBRE: { opcion: "Mi nombre", nombre: "el nombre" },
  DNI: { opcion: "Mi DNI", nombre: "el DNI" },
  DIRECCION: { opcion: "Mi vivienda (manzana y lote)", nombre: "la vivienda" },
};

/** "S-0031": así se nombra una solicitud de privacidad. */
export const numeroDeSolicitud = (numero: number) => `S-${String(numero).padStart(4, "0")}`;

const LIMA_MS = 5 * 3_600_000;
const DIA_MS = 24 * 3_600_000;
/** El día de Lima (UTC−5 todo el año) como número de días desde 1970. */
const diaDeLima = (fecha: Date) => Math.floor((fecha.getTime() - LIMA_MS) / DIA_MS);
const esHabil = (dia: number) => {
  const semana = new Date(dia * DIA_MS).getUTCDay();
  return semana !== 0 && semana !== 6;
};

/** Días hábiles que pasaron desde el día en que llegó la solicitud (ese día no cuenta). */
export function diasHabilesDesde(llegada: Date, ahora: Date) {
  let dias = 0;
  for (let dia = diaDeLima(llegada) + 1; dia <= diaDeLima(ahora); dia++) if (esHabil(dia)) dias++;
  return dias;
}

/** El último día del plazo legal, a medianoche de Lima. */
export function fechaLimite(llegada: Date, tipo: TipoArco) {
  let dia = diaDeLima(llegada);
  for (let contados = 0; contados < PLAZO_DIAS_HABILES[tipo];) if (esHabil(++dia)) contados++;
  return new Date(dia * DIA_MS + LIMA_MS);
}

/** Cómo va el plazo (HU-GAR-16 CA2): días usados, restantes y si hay que alertar. */
export function estadoDelPlazo(llegada: Date, tipo: TipoArco, ahora: Date) {
  const usados = diasHabilesDesde(llegada, ahora);
  const plazo = PLAZO_DIAS_HABILES[tipo];
  return { usados, plazo, restantes: plazo - usados, porVencer: plazo - usados <= DIAS_DE_ALERTA };
}

/** "Mz. C, lote 8" o "C 8" → manzana y lote, para mover la residencia al aprobar. */
export function leerVivienda(texto: string) {
  const partes = texto.trim().match(/^(?:mz\.?\s*)?([a-z])\s*[,-]?\s*(?:lote\s*)?(\d{1,4}[a-z]?)$/i);
  return partes ? { manzana: partes[1].toUpperCase(), lote: partes[2].toUpperCase() } : null;
}

/** Revisa el dato correcto que escribe el vecino. Devuelve el error en lenguaje llano o null. */
export function errorDeRectificacion(campo: CampoRectificable, valor: string, anterior: string) {
  const limpio = valor.trim();
  if (!limpio) return "Escriba el dato correcto.";
  if (campo === "NOMBRE" && limpio.length < 3) return "Escriba su nombre y apellidos.";
  if (campo === "DNI" && !/^\d{8}$/.test(limpio)) return "El DNI tiene 8 números.";
  if (campo === "DIRECCION" && !leerVivienda(limpio))
    return 'Escriba la manzana y el lote, por ejemplo "Mz. C, lote 8".';
  if (limpio.toLowerCase() === anterior.toLowerCase()) return "Es igual al dato que ya tenemos.";
  return null;
}
