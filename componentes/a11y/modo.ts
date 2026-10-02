// Nombres que comparten el layout raíz, el route handler del perfil y el switch "Letra grande".

/** Cookie HttpOnly con el id del PerfilAccesibilidad guardado en el servidor (ADR-004). */
export const COOKIE_PERFIL = "perfil";

/**
 * Solo si no se pudo guardar en el servidor: el modo elegido se mantiene en este dispositivo
 * (FRONTEND.md §3). Al guardar bien, el switch la borra.
 */
export const COOKIE_MODO_DISPOSITIVO = "modo_dispositivo";

export const RUTA_PERFIL = "/api/accesibilidad/perfil";
