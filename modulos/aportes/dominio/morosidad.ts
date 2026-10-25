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

/**
 * La cuota por la que toca el recordatorio amable (HU-COB-05): la más antigua que todavía se debe, cuando la casa cumple
 * 7 días de retraso y todavía no llega a las 8 semanas (desde ahí es otra cosa: HU-COB-06), y solo si no se avisó ya de
 * esa cuota (una sola alerta por cuota). Si paga esa cuota y se atrasa la siguiente, la siguiente tiene su propio aviso.
 */
export function cuotaParaAlertar<T extends { id: string; fechaLimite: Date }>(
  impagas: T[],
  ahora: Date,
  yaAlertadas: ReadonlySet<string>,
): T | null {
  if (clasificarMorosidad(impagas, ahora) !== "MOROSO_PREVENTIVO") return null;
  const masAntigua = impagas.reduce((menor, c) => (c.fechaLimite < menor.fechaLimite ? c : menor));
  return yaAlertadas.has(masAntigua.id) ? null : masAntigua;
}

/** Lo que se le avisa a la directiva cuando el worker envía recordatorios amables (HU-COB-05 CA3): cuántos y que no hubo recargo. */
export const textoDeRecordatorios = (n: number) =>
  n === 1
    ? "Se envió 1 recordatorio amable a una casa con una semana de atraso. No se aplicó ningún recargo."
    : `Se enviaron ${n} recordatorios amables a casas con una semana de atraso. No se aplicó ningún recargo.`;

/** Lo que se le avisa a la directiva cuando casas llegan a 8 semanas sin pago y la reja deja de abrirse sola (HU-COB-06). */
export const textoDeSuspensiones = (n: number) =>
  n === 1
    ? "1 casa llegó a 8 semanas sin pago. La reja ya no se le abre sola y se le avisó."
    : `${n} casas llegaron a 8 semanas sin pago. La reja ya no se les abre sola y se les avisó.`;
