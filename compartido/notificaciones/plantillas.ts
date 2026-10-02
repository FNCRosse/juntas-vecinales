// Plantillas de WhatsApp aprobadas en Meta (docs/DESPLIEGUE.md §4): el nombre y el orden de los
// parámetros deben coincidir con los de Meta.

/**
 * Enlace de entrada (HU-GAR-01, HU-GAR-02). Texto en Meta: "Hola, {{1}}. Este es su enlace para
 * entrar a la plataforma de la Junta Vecinal: {{2}}. Sirve una sola vez y vence en 15 minutos."
 */
export function plantillaEnlaceAcceso(nombre: string, enlace: string) {
  return { plantilla: "enlace_acceso", parametros: [nombre, enlace] };
}
