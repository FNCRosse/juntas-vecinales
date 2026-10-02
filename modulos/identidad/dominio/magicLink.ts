// @HU-GAR-01 @HU-GAR-02 @HU-GAR-11 @HU-GAR-25
// MagicLink del diagrama 02a: acceso personal de un solo uso y vigencia limitada (R-01).

export const MINUTOS_DE_VIGENCIA = 15;

export function venceEn(emitidoEn: Date) {
  return new Date(emitidoEn.getTime() + MINUTOS_DE_VIGENCIA * 60_000);
}

export type EstadoEnlace = "VIGENTE" | "USADO" | "ANULADO" | "VENCIDO";

/** Un enlace sirve una sola vez, mientras no venza ni lo reemplace uno nuevo (HU-GAR-02 CA1). */
export function estadoDelEnlace(
  enlace: { usadoEn: Date | null; anuladoEn: Date | null; expiraEn: Date },
  ahora: Date,
): EstadoEnlace {
  if (enlace.usadoEn) return "USADO";
  if (enlace.anuladoEn) return "ANULADO";
  if (enlace.expiraEn <= ahora) return "VENCIDO";
  return "VIGENTE";
}

export type PropositoEnlace = "ENTRADA" | "CLAVE";

/** Para no llenar de mensajes un WhatsApp: uno por minuto y cinco por hora (HU-GAR-11, HU-GAR-25). */
export const SEGUNDOS_ENTRE_ENLACES = 60;
export const MAX_ENLACES_POR_HORA = 5;

export function puedeEmitirOtro(emitidosUltimaHora: Date[], ahora: Date): "SI" | "MUY_SEGUIDO" | "EN_PAUSA" {
  if (emitidosUltimaHora.length >= MAX_ENLACES_POR_HORA) return "EN_PAUSA";
  const ultimo = Math.max(0, ...emitidosUltimaHora.map((f) => f.getTime()));
  return ahora.getTime() - ultimo < SEGUNDOS_ENTRE_ENLACES * 1000 ? "MUY_SEGUIDO" : "SI";
}

/**
 * "Su DNI o el número de su casa" (prototipo VEC-ACC-04): 8 números son un DNI; una letra y un
 * número son manzana y lote ("Mz. C lote 7", "C-7", "c 7").
 */
export function interpretarIdentificador(
  texto: string,
): { dni: string } | { manzana: string; lote: string } | null {
  const limpio = texto.trim();
  if (/^\d{8}$/.test(limpio)) return { dni: limpio };
  const casa = limpio.match(/^(?:mz\.?|manzana)?\s*([a-z])\s*[,-]?\s*(?:lote|lt\.?)?\s*(\d{1,4}[a-z]?)$/i);
  return casa ? { manzana: casa[1].toUpperCase(), lote: casa[2].toUpperCase() } : null;
}
