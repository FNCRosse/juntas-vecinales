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

/**
 * La reja no se abre sola (HU-GAR-06 CA3). Texto en Meta: "Hola, {{1}}. Hoy a las {{2}} entró a
 * {{3}} abriendo la reja a mano: por ahora no se abre sola para su casa. Cuando se ponga al día con
 * su cuota, vuelve a abrirse sola."
 */
export function plantillaRejaManual(nombre: string, hora: string, vivienda: string) {
  return { plantilla: "reja_manual", parametros: [nombre, hora, vivienda] };
}

/**
 * Apertura por emergencia, para la directiva (HU-GAR-06). Texto en Meta: "La garita abrió la reja por
 * una emergencia a las {{1}}: {{2}}, para {{3}}. Quedó en la bitácora."
 */
export function plantillaEmergenciaGarita(hora: string, motivo: string, vivienda: string) {
  return { plantilla: "emergencia_garita", parametros: [hora, motivo, vivienda] };
}

/**
 * Llegó una visita anunciada (HU-GAR-07 CA1). Texto en Meta: "Hola, {{1}}. Su visita {{2}} llegó a la
 * garita a las {{3}} y ya pasó."
 */
export function plantillaVisitaLlego(nombre: string, visita: string, hora: string) {
  return { plantilla: "visita_llego", parametros: [nombre, visita, hora] };
}

/**
 * Visita no anunciada en la puerta (HU-GAR-07 CA2). Texto en Meta: "Hola, {{1}}. {{2}} está en la
 * garita y pregunta por usted. Responda si la deja pasar aquí: {{3}} o llame a la garita."
 */
export function plantillaVisitaEnPuerta(nombre: string, visita: string, enlace: string) {
  return { plantilla: "visita_en_puerta", parametros: [nombre, visita, enlace] };
}

/**
 * Resultado de una solicitud de privacidad (HU-GAR-13 CA3, HU-GAR-16 CA3). Texto en Meta: "Hola,
 * {{1}}. Su solicitud {{2}} a la Junta Vecinal fue {{3}}."
 */
export function plantillaSolicitudPrivacidad(nombre: string, numero: string, resultado: string) {
  return { plantilla: "solicitud_privacidad", parametros: [nombre, numero, resultado] };
}

/**
 * Cambio de número (HU-GAR-17 CA3), al número nuevo y al anterior. Texto en Meta: "Hola, {{1}}. El
 * WhatsApp de su cuenta en la Junta Vecinal cambió al número terminado en {{2}}. Si no lo pidió
 * usted, avise a la administración."
 */
export function plantillaNumeroCambiado(nombre: string, terminaEn: string) {
  return { plantilla: "numero_cambiado", parametros: [nombre, terminaEn] };
}
