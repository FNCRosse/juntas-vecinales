// @HU-GAR-06 @HU-GAR-07 @HU-GAR-08
// ConsultaGarita y ResultadoSemaforo del diagrama 02a. El vigilante ve nombre, vivienda, placa y
// estado; nunca montos ni el detalle de la deuda (AC-7).

import { normalizarPlaca } from "./visita";

export type Semaforo = "VERDE" | "ROJO";

export const SEMAFORO: Record<Semaforo, string> = {
  VERDE: "Vecino al día: puede abrir la reja",
  ROJO: "Vecino con atraso: no abrirle la reja",
};

/** Qué escribió el vigilante: un DNI (8 números), una placa (letras y números) o un nombre. */
export function clasificarBusqueda(
  texto: string,
): { dni: string } | { placa: string } | { nombre: string } | null {
  const limpio = texto.trim();
  if (limpio.length < 2) return null;
  if (/^\d{8}$/.test(limpio)) return { dni: limpio };
  const compacto = limpio.toUpperCase().replace(/[\s-]/g, "");
  if (/^[A-Z0-9]{5,7}$/.test(compacto) && /\d/.test(compacto) && /[A-Z]/.test(compacto)) {
    return { placa: normalizarPlaca(compacto) };
  }
  return { nombre: limpio };
}

/** Una visita anunciada se puede recibir desde 30 minutos antes de su hora hasta el fin del permiso. */
export const MINUTOS_ANTES = 30;
export const llegaAHora = (visita: { desde: Date; hasta: Date }, ahora: Date) =>
  visita.desde.getTime() - MINUTOS_ANTES * 60_000 <= ahora.getTime() && ahora < visita.hasta;

/** Un vehículo de visita que lleva más de 6 horas dentro se revisa (HU-GAR-08 CA2). */
export const HORAS_DE_ALERTA = 6;
export const llevaDemasiado = (entrada: Date, ahora: Date) =>
  ahora.getTime() - entrada.getTime() > HORAS_DE_ALERTA * 3_600_000;

export const MOTIVOS_EMERGENCIA = {
  SALUD: "Una emergencia de salud",
  SEGURIDAD: "Un problema de seguridad",
  OTRO: "Otra urgencia",
} as const;
export type MotivoEmergencia = keyof typeof MOTIVOS_EMERGENCIA;

/** Cómo se lee cada fila de la bitácora (VIG-BIT-01). */
export const MODOS_ACCESO = {
  VECINO_REJA: "Vecino · reja abierta por el vigilante",
  VECINO_A_MANO: "Vecino · abrió a mano",
  EMERGENCIA: "Reja abierta por emergencia",
  VISITA: "Visita",
  NO_ENTRO: "No entró",
} as const;

const sinTildes = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Buscador de la bitácora (VIG-15): todas las palabras escritas deben aparecer en el nombre, la placa, la vivienda o el detalle. */
export function coincideConBusqueda(
  fila: { quien: string; placa: string | null; vivienda: string; descripcion: string },
  texto: string,
) {
  const palabras = sinTildes(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return true;
  const pajar = sinTildes(`${fila.quien} ${fila.vivienda} ${fila.descripcion}`);
  const placa = (fila.placa ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return palabras.every((p) => {
    const sinSimbolos = p.replace(/[^a-z0-9]/g, "");
    return pajar.includes(p) || (sinSimbolos !== "" && placa.includes(sinSimbolos));
  });
}

/** "DNI terminado en 21": basta para reconocer a alguien sin mostrar el número completo. */
export const dniTerminadoEn = (dni: string | null) => (dni ? `DNI terminado en ${dni.slice(-2)}` : null);
