// @HU-GAR-01
// MagicLink del diagrama 02a: acceso personal de un solo uso y vigencia limitada (R-01).

export const MINUTOS_DE_VIGENCIA = 15;

export function venceEn(emitidoEn: Date) {
  return new Date(emitidoEn.getTime() + MINUTOS_DE_VIGENCIA * 60_000);
}
