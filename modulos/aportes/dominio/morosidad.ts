// @HU-COB-09
// Estado de una casa según lo que debe (EvaluadorMorosidad, diagrama 02b): retraso en días desde la fecha límite de la
// cuota impaga más antigua. Desde 7 días, preventivo; desde 8 semanas seguidas, crítico (suspende la garita). Al vecino
// nunca se le dice «moroso»: eso lo cuida la pantalla. El dominio solo clasifica.

export const DIAS_PARA_PREVENTIVO = 7;
export const SEMANAS_PARA_CRITICO = 8;
export type EstadoMorosidad = "SOLVENTE" | "MOROSO_PREVENTIVO" | "MOROSO_CRITICO";

const DIA = 86_400_000;

/** Días de retraso de la cuota impaga más antigua; cero si no hay ninguna vencida. `impagas` son las cuotas que todavía se deben. */
export function diasDeRetraso(impagas: { fechaLimite: Date }[], ahora: Date) {
  const masAntigua = impagas.reduce<Date | null>(
    (menor, c) => (menor === null || c.fechaLimite < menor ? c.fechaLimite : menor),
    null,
  );
  if (!masAntigua || masAntigua >= ahora) return 0;
  return Math.floor((ahora.getTime() - masAntigua.getTime()) / DIA);
}

export function clasificarMorosidad(impagas: { fechaLimite: Date }[], ahora: Date): EstadoMorosidad {
  const dias = diasDeRetraso(impagas, ahora);
  if (dias >= SEMANAS_PARA_CRITICO * 7) return "MOROSO_CRITICO";
  if (dias >= DIAS_PARA_PREVENTIVO) return "MOROSO_PREVENTIVO";
  return "SOLVENTE";
}
