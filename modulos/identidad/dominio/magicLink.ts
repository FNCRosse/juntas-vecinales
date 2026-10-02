// @HU-GAR-01 @HU-GAR-02
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
