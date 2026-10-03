// @HU-QUE-09
import type { Estado } from "./queja";

// SeguimientoTicket: el avance de un reporte en tres pasos, en palabras (VEC-QUE-08). Solo datos del
// propio reporte: estado, fechas y lo que la directiva escribió para quien reportó (HU-QUE-09 CA3).

export const MAXIMO_CONSULTAS = 10;
export const VENTANA_CONSULTAS_MS = 15 * 60 * 1000;

/** "q-2026-00142-k7qm " → "Q-2026-00142-K7QM": el código como lo escribió, sin espacios ni minúsculas. */
export const normalizarCodigo = (texto: string) => texto.replace(/\s+/g, "").toUpperCase();

/** ¿Pasó el límite de consultas de esa conexión en la ventana? Así nadie prueba códigos al azar. */
export const superaLimite = (consultasRecientes: number) => consultasRecientes >= MAXIMO_CONSULTAS;

export type EstadoPaso = "hecho" | "ahora" | "pendiente";
export type Paso = { titulo: string; texto: string; estado: EstadoPaso };

/** Los tres pasos del avance y el estado escrito de cada uno (nunca solo con color). */
export function pasosDelAvance(estado: Estado, fechaRegistro: string): Paso[] {
  const cerrado = estado === "RESUELTO" || estado === "DERIVADO_ENTIDAD_EXTERNA";
  const recibido: Paso = { titulo: "1. Recibido", texto: fechaRegistro, estado: "hecho" };
  if (estado === "RECHAZADO") {
    return [
      recibido,
      {
        titulo: "2. Revisado: no procede",
        texto: "La directiva revisó lo que envió y decidió que no corresponde atenderlo.",
        estado: "hecho",
      },
    ];
  }
  return [
    recibido,
    {
      titulo: "2. En revisión",
      texto: "La directiva revisa lo que envió y decide qué hacer.",
      estado: estado === "RECIBIDO" || estado === "EN_REVISION" ? "ahora" : "hecho",
    },
    {
      titulo:
        estado === "RESUELTO"
          ? "3. Resuelto"
          : estado === "DERIVADO_ENTIDAD_EXTERNA"
            ? "3. Derivado"
            : "3. Resuelto o derivado",
      texto:
        estado === "RESUELTO"
          ? "La junta conversó y llegó a un acuerdo."
          : estado === "DERIVADO_ENTIDAD_EXTERNA"
            ? "La junta lo pasó a la Municipalidad o a la Policía porque no le toca resolverlo."
            : "Resuelto: la junta conversó y llegó a un acuerdo. Derivado: la junta lo pasó a la Municipalidad o a la Policía porque no le toca resolverlo.",
      estado: cerrado ? "hecho" : "pendiente",
    },
  ];
}
