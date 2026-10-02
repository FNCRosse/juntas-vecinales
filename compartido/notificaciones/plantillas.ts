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
