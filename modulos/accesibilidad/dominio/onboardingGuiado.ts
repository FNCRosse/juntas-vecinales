// @HU-ACC-10
// OnboardingGuiado: la guía opcional de una sección, de cinco pasos como máximo (CA1), que se puede
// omitir, pausar o volver a ver (CA2) y que no se vuelve a ofrecer sola una vez vista u omitida (CA3).

export const MAXIMO_PASOS = 5;

export type EstadoGuia = "EN_CURSO" | "PAUSADA" | "OMITIDA" | "COMPLETADA";
export type AccionGuia = "avanzar" | "pausar" | "omitir" | "completar" | "reactivar";

/** ¿Se ofrece la guía al entrar a la sección? Sí la primera vez y mientras esté en pausa. */
export const debeOfrecerse = (estado: EstadoGuia | null) => estado === null || estado === "PAUSADA";

/** El nuevo estado y el paso tras una acción; el paso queda entre 0 y el último. */
export function aplicarAccion(accion: AccionGuia, totalPasos: number, paso = 0) {
  const ultimo = Math.min(totalPasos, MAXIMO_PASOS) - 1;
  const dentro = Math.max(0, Math.min(Number.isInteger(paso) ? paso : 0, ultimo));
  switch (accion) {
    case "avanzar":
      return { estado: "EN_CURSO" as const, paso: dentro };
    case "pausar":
      return { estado: "PAUSADA" as const, paso: dentro };
    case "omitir":
      return { estado: "OMITIDA" as const, paso: 0 };
    case "completar":
      return { estado: "COMPLETADA" as const, paso: ultimo };
    case "reactivar":
      return { estado: "EN_CURSO" as const, paso: 0 };
  }
}

/** Cómo se ve el estado en "Guías de uso" (VEC-AYU-03). */
export function estadoEnTexto(estado: EstadoGuia | null, paso: number, totalPasos: number) {
  if (estado === "COMPLETADA") return "Ya la vio";
  if (estado === "OMITIDA") return "La saltó; puede verla cuando quiera";
  if (estado === "PAUSADA" || (estado === "EN_CURSO" && paso > 0))
    return `La dejó en el paso ${paso + 1} de ${totalPasos}`;
  return "Todavía no la ve";
}
