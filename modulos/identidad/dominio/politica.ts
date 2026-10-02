// @HU-GAR-02
// Versión de la política de privacidad que acepta el vecino (Ley 29733, docs/DATOS.md §6). Si el
// texto cambia, sube la versión y se vuelve a pedir la aceptación.

export const VERSION_POLITICA = "2026-10";

/** Hay que pedir la aceptación si nunca aceptó o aceptó una versión anterior. */
export const faltaAceptarPolitica = (versionAceptada: string | null) => versionAceptada !== VERSION_POLITICA;
