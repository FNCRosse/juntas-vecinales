// @HU-COB-05
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

/**
 * Las cuotas que todavía se deben (con saldo), por casa y de la más antigua a la más nueva. Las que la casa tiene en
 * discrepancia (reclamo en revisión, HU-COB-03) no cuentan: «mientras tanto no tiene que pagar la diferencia que reclama».
 */
export async function cuotasImpagasPorCasa() {
  const cuotas = await prisma.cuota.findMany({
    where: { estado: { notIn: ["PAGADA", "EN_DISCREPANCIA"] }, saldoPendiente: { gt: 0 } },
    orderBy: [{ predioId: "asc" }, { periodo: "asc" }],
  });
  const porCasa = new Map<string, typeof cuotas>();
  for (const cuota of cuotas) porCasa.set(cuota.predioId, [...(porCasa.get(cuota.predioId) ?? []), cuota]);
  return porCasa;
}

/** De cuáles de esas cuotas ya se avisó. */
export async function cuotasYaAlertadas(cuotaIds: string[]) {
  if (!cuotaIds.length) return new Set<string>();
  const filas = await prisma.alertaPreventiva.findMany({
    where: { cuotaId: { in: cuotaIds } },
    select: { cuotaId: true },
  });
  return new Set(filas.map((f) => f.cuotaId));
}

/** Deja constancia del recordatorio. UNIQUE por cuota: si otra corrida llegó primero, falla y no se avisa dos veces (AC-5). */
export const registrarAlerta = (
  tx: Transaccion,
  datos: {
    cuotaId: string;
    predioId: string;
    diasDeRetraso: number;
    debe: number;
    residentesAvisados: number;
    enviadaEn: Date;
  },
) => tx.alertaPreventiva.create({ data: datos });
