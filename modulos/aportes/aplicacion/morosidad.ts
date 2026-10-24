// @HU-COB-05
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { etiquetaDeSemana, lunesDe } from "@/modulos/aportes/dominio/cuota";
import { cuotaParaAlertar, diasDeRetraso } from "@/modulos/aportes/dominio/morosidad";
import {
  cuotasImpagasPorCasa,
  cuotasYaAlertadas,
  registrarAlerta,
} from "@/modulos/aportes/infraestructura/repositorioMorosidad";
import { casasDe } from "@/modulos/identidad/aplicacion/comunidad";

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** Cómo pagar, con lo que haya configurado la junta (los datos los pone la autora; sin ellos, solo el efectivo en casa). */
function formasDePago() {
  const formas = [
    process.env.DATOS_PAGO_YAPE && `con Yape o Plin (${process.env.DATOS_PAGO_YAPE})`,
    process.env.DATOS_PAGO_CUENTA && `por transferencia a la cuenta ${process.env.DATOS_PAGO_CUENTA}`,
    "pidiendo que vayan a cobrarle en efectivo a su casa",
  ].filter(Boolean);
  return formas.length > 1 ? `${formas.slice(0, -1).join(", ")} o ${formas.at(-1)}` : String(formas[0]);
}

/**
 * Tarea del worker (HU-COB-05): a la semana de retraso, un recordatorio amable a la casa. Mira a cada casa que debe: si su
 * cuota impaga más antigua cumplió 7 días de la fecha límite (y todavía no llega a las 8 semanas) y de esa cuota no se
 * avisó, avisa a sus residentes con el monto y cómo pagar, en tono cordial y sin sanciones (R-07), y lo deja en la
 * bitácora (`AlertaPreventiva`, una por cuota). No toca la garita ni cobra nada de más. Idempotente: correrla varias veces,
 * o dos a la vez, no avisa dos veces de la misma cuota. Las casas sin residentes vigentes no tienen a quién avisar.
 */
export async function alertarMorosidad(ahora = new Date()) {
  const porCasa = await cuotasImpagasPorCasa();
  const yaAlertadas = await cuotasYaAlertadas([...porCasa.values()].flat().map((c) => c.id));
  const candidatas = [...porCasa].flatMap(([predioId, impagas]) => {
    const cuota = cuotaParaAlertar(impagas, ahora, yaAlertadas);
    return cuota ? [{ predioId, cuota, impagas }] : [];
  });
  if (!candidatas.length) return { casas: 0, alertas: 0 };

  const casas = await casasDe(candidatas.map((c) => c.predioId));
  let alertas = 0;
  for (const { predioId, cuota, impagas } of candidatas) {
    const residentes = casas.get(predioId)?.residentes ?? [];
    if (!residentes.length) continue;
    const debe = impagas.reduce((suma, c) => suma + c.saldoPendiente, 0);
    try {
      await prisma.$transaction(async (tx) => {
        await registrarAlerta(tx, {
          cuotaId: cuota.id,
          predioId,
          diasDeRetraso: diasDeRetraso(impagas, ahora),
          debe,
          residentesAvisados: residentes.length,
          enviadaEn: ahora,
        });
        await encolarAvisos(
          residentes.map((destinatarioId) => ({
            destinatarioId,
            tipo: "PAGOS" as const,
            titulo: "Un recordatorio amable sobre su cuota",
            texto: `Su cuota de la ${minuscula(etiquetaDeSemana(lunesDe(cuota.periodo)))} todavía está pendiente. Hoy debe ${soles(debe)}. Puede pagarla cuando le sea posible, sin ningún costo adicional: ${formasDePago()}. Véala en Mi cuota.`,
          })),
          tx,
        );
      });
      alertas += 1;
    } catch (error) {
      // Otra corrida avisó de esa cuota a la vez: ya está, no se repite (UNIQUE por cuota).
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
  }
  if (alertas) {
    await prisma.$transaction((tx) =>
      registrarAuditoria(
        {
          actorId: null,
          accion: "alertar_morosidad",
          entidad: "Ciclo",
          entidadId: lunesDe(ahora),
          antes: null,
          despues: { recordatorios: alertas },
        },
        tx,
      ),
    );
  }
  return { casas: candidatas.length, alertas };
}
