import type { NombreRol } from "@/modulos/identidad/aplicacion/sesion";

/**
 * Para qué se puede subir un archivo, a qué carpeta va, quién puede subirlo (`roles`) y quién más puede
 * verlo (`ven`; además de quien lo subió). Cada módulo agrega su uso.
 */
export const USOS = {
  comprobante_egreso: {
    carpeta: "comprobantes",
    clase: "documento",
    roles: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    ven: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"],
  },
  // La evidencia de una queja la sube el vecino y la ve solo la directiva: otro vecino nunca (AC-7).
  evidencia_queja: {
    carpeta: "evidencias",
    clase: "evidencia",
    roles: ["VECINO", "VECINO_ADULTO_MAYOR"],
    ven: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"],
  },
} as const satisfies Record<
  string,
  { carpeta: string; clase: "documento" | "evidencia"; roles: NombreRol[]; ven: NombreRol[] }
>;
