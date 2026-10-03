// @HU-QUE-01 @HU-QUE-02 @HU-QUE-03 @HU-QUE-04
// Reglas de la queja: qué datos exige (HU-QUE-01 CA1–CA3) y cómo se arma su código de seguimiento
// (HU-QUE-04 CA1). Sin dependencias: solo datos.

export const CATEGORIAS = {
  RUIDOS: "Ruidos molestos",
  BASURA: "Basura",
  COCHERAS: "Cocheras o autos mal estacionados",
  SEGURIDAD: "Seguridad",
  OTROS: "Otro problema",
} as const;
export type Categoria = keyof typeof CATEGORIAS;

export const ESTADOS = {
  RECIBIDO: "Recibido, pendiente de revisión",
  EN_REVISION: "En revisión",
  RECHAZADO: "No procede",
  RESUELTO: "Resuelto",
  DERIVADO_ENTIDAD_EXTERNA: "Derivado a una entidad externa",
} as const;
export type Estado = keyof typeof ESTADOS;

export const MAXIMO_EVIDENCIAS = 3;
const MAXIMO_DESCRIPCION = 1000;
const MAXIMO_REFERENCIA = 120;

export type DatosQueja = {
  categoria?: string | null;
  descripcion: string;
  /** La manzana del padrón; null: otro lugar del barrio, que se describe en la referencia. */
  manzana: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  evidencias: string[];
  consentimiento: boolean;
  /** Modo anónimo (HU-QUE-02): nadie ve quién lo envió. */
  esAnonimo?: boolean;
};

const MENSAJES = {
  categoria: "Elija qué tipo de problema es.",
  descripcion: 'Falta contar qué pasó. Unas pocas palabras bastan, por ejemplo: "música fuerte de noche".',
  descripcionLarga: `Cuéntelo en menos de ${MAXIMO_DESCRIPCION} letras.`,
  lugar: 'Falta el lugar. Pulse "Cerca de mi casa" o elija la manzana.',
  referencia: "Escriba dónde fue, por ejemplo: la esquina del parque.",
  referenciaLarga: `Escriba la referencia en menos de ${MAXIMO_REFERENCIA} letras.`,
  ubicacion: "No pudimos leer su ubicación. Vuelva a pulsar el botón o elija la manzana.",
  evidencias:
    "Falta una foto o video. Si no puede tomarla, pida ayuda a una persona y la directiva registrará su reporte.",
  muchasEvidencias: `Adjunte hasta ${MAXIMO_EVIDENCIAS} fotos o videos.`,
  consentimiento: "Falta marcar esta casilla. Es necesaria para registrar el reporte.",
  consentimientoAsistido: "Confirme que el vecino aceptó la política de privacidad.",
} as const;

const esCoordenada = (valor: unknown, limite: number) =>
  typeof valor === "number" && Number.isFinite(valor) && Math.abs(valor) <= limite;

/**
 * Revisa lo que exige el formulario (CA1: consentimiento; CA2: categoría y evidencia; CA3: descripción,
 * ubicación y evidencia completas). Devuelve los errores por campo y la queja lista para guardar. En la
 * queja asistida (HU-QUE-03) la evidencia es opcional: es la salida para quien no puede tomar la foto.
 */
export function prepararQueja(datos: DatosQueja, { asistida = false } = {}) {
  const errores: Record<string, string> = {};
  const descripcion = datos.descripcion.trim();
  const referencia = datos.referencia?.trim() || null;

  if (!datos.categoria || !(datos.categoria in CATEGORIAS)) errores.categoria = MENSAJES.categoria;
  if (!descripcion) errores.descripcion = MENSAJES.descripcion;
  else if (descripcion.length > MAXIMO_DESCRIPCION) errores.descripcion = MENSAJES.descripcionLarga;

  if (referencia && referencia.length > MAXIMO_REFERENCIA) errores.lugar = MENSAJES.referenciaLarga;
  else if (datos.manzana === null && !referencia) errores.lugar = MENSAJES.referencia;
  else if (datos.manzana !== null && !datos.manzana.trim()) errores.lugar = MENSAJES.lugar;

  const conUbicacion = datos.latitud != null || datos.longitud != null;
  if (conUbicacion && !(esCoordenada(datos.latitud, 90) && esCoordenada(datos.longitud, 180))) {
    errores.lugar ??= MENSAJES.ubicacion;
  }

  const evidencias = [...new Set(datos.evidencias.filter(Boolean))];
  if (!evidencias.length && !asistida) errores.evidencias = MENSAJES.evidencias;
  else if (evidencias.length > MAXIMO_EVIDENCIAS) errores.evidencias = MENSAJES.muchasEvidencias;

  if (!datos.consentimiento) {
    errores.consentimiento = asistida ? MENSAJES.consentimientoAsistido : MENSAJES.consentimiento;
  }

  return {
    errores,
    queja: {
      categoria: datos.categoria as Categoria,
      descripcion,
      manzana: datos.manzana?.trim() || null,
      referencia,
      latitud: conUbicacion ? (datos.latitud as number) : null,
      longitud: conUbicacion ? (datos.longitud as number) : null,
      evidencias,
      esAnonimo: datos.esAnonimo === true,
    },
  };
}

/** Letras y números que no se confunden al leerlos o dictarlos (sin 0, O, 1, I ni L). */
const ALFABETO_SUFIJO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** El sufijo aleatorio del código: impide adivinar el código de otra persona. */
export function sufijoAleatorio(aleatorio: (maximo: number) => number) {
  return Array.from({ length: 4 }, () => ALFABETO_SUFIJO[aleatorio(ALFABETO_SUFIJO.length)]).join("");
}

/** `Q-<año>-<correlativo de 5 dígitos>-<4 caracteres>`: el correlativo da la trazabilidad (CA1). */
export const codigoTicket = (anio: number, numero: number, sufijo: string) =>
  `Q-${anio}-${String(numero).padStart(5, "0")}-${sufijo}`;

/** "N.° 00142", como se nombra el reporte en las pantallas. */
export const numeroVisible = (numero: number) => `N.° ${String(numero).padStart(5, "0")}`;

/** "Mz. C, frente al parque" u "Otro lugar del barrio: la esquina del mercado". */
export function lugarEnTexto(manzana: string | null, referencia: string | null) {
  if (manzana === null) return `Otro lugar del barrio: ${referencia ?? ""}`.trim();
  return referencia ? `Mz. ${manzana}, ${referencia}` : `Mz. ${manzana}`;
}
