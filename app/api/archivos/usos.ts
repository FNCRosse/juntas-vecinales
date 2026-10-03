import type { NombreRol } from "@/modulos/identidad/aplicacion/sesion";

/** Para qué se puede subir un archivo, a qué carpeta va y quién puede pedirlo. Cada módulo agrega su uso. */
export const USOS = {
  comprobante_egreso: {
    carpeta: "comprobantes",
    clase: "documento",
    roles: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"],
  },
  evidencia_queja: {
    carpeta: "evidencias",
    clase: "evidencia",
    roles: ["VECINO", "VECINO_ADULTO_MAYOR"],
  },
} as const satisfies Record<
  string,
  { carpeta: string; clase: "documento" | "evidencia"; roles: NombreRol[] }
>;
