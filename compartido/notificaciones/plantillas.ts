// Plantillas de WhatsApp aprobadas en Meta (docs/DESPLIEGUE.md §4): el nombre y el orden de los
// parámetros deben coincidir con los de Meta.

/**
 * Enlace de entrada (HU-GAR-01, HU-GAR-02). Texto en Meta: "Hola, {{1}}. Este es su enlace para
 * entrar a la plataforma de la Junta Vecinal: {{2}}. Sirve una sola vez y vence en 15 minutos."
 */
export function plantillaEnlaceAcceso(nombre: string, enlace: string) {
  return { plantilla: "enlace_acceso", parametros: [nombre, enlace] };
}

/**
 * Enlace para crear una clave nueva (HU-GAR-25). Texto en Meta: "Hola, {{1}}. Para crear su clave
 * nueva de la Junta Vecinal, abra este enlace: {{2}}. Sirve una sola vez y vence en 15 minutos."
 */
export function plantillaClaveNueva(nombre: string, enlace: string) {
  return { plantilla: "clave_nueva", parametros: [nombre, enlace] };
}

/**
 * Aviso de clave cambiada (HU-GAR-25 CA3). Texto en Meta: "Hola, {{1}}. Su clave de respaldo de
 * la Junta Vecinal cambió. Si no fue usted, avise a la administración."
 */
export function plantillaClaveCambiada(nombre: string) {
  return { plantilla: "clave_cambiada", parametros: [nombre] };
}

/**
 * Invitación al equipo (HU-GAR-21 CA2). Texto en Meta: "Hola, {{1}}. La Junta Vecinal le dio acceso
 * de equipo como {{2}}. Para crear su clave, abra este enlace: {{3}}. Vence en 48 horas."
 */
export function plantillaInvitacionEquipo(nombre: string, rol: string, enlace: string) {
  return { plantilla: "invitacion_equipo", parametros: [nombre, rol, enlace] };
}

/**
 * Cambio de rol (HU-GAR-23). Texto en Meta: "Hola, {{1}}. Su rol en el equipo de la Junta Vecinal
 * ahora es {{2}}. Sus permisos ya cambiaron."
 */
export function plantillaRolCambiado(nombre: string, rol: string) {
  return { plantilla: "rol_cambiado", parametros: [nombre, rol] };
}

/**
 * Baja del padrón (HU-GAR-09 CA3). Texto en Meta: "Hola, {{1}}. La Junta Vecinal registró que ya no
 * vive en {{2}}. Sus accesos a la plataforma y a la garita quedaron cancelados."
 */
export function plantillaBajaPadron(nombre: string, direccion: string) {
  return { plantilla: "baja_padron", parametros: [nombre, direccion] };
}

/**
 * Pedido de ayuda para el mediador (HU-ACC-04 CA2). Texto en Meta: "{{1}} pidió ayuda en la app de
 * la Junta Vecinal. Se quedó en: {{2}}. Prefiere: {{3}}."
 */
export function plantillaPedidoAyuda(quien: string, pantalla: string, modo: string) {
  return { plantilla: "pedido_ayuda", parametros: [quien, pantalla, modo] };
}
