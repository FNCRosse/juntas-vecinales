// @HU-COB-05 @HU-COB-06
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import type { Transaccion } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { etiquetaDeSemana, lunesDe } from "@/modulos/aportes/dominio/cuota";
import {
  clasificarMorosidad,
  cuotaParaAlertar,
  diasDeRetraso,
  SEMANAS_PARA_CRITICO,
  textoDeRecordatorios,
  textoDeSuspensiones,
} from "@/modulos/aportes/dominio/morosidad";
import { textoDeSemanas } from "@/modulos/aportes/dominio/pago";
import { cuotasPorPagarDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import {
  cuotasImpagasPorCasa,
  cuotasYaAlertadas,
  registrarAlerta,
} from "@/modulos/aportes/infraestructura/repositorioMorosidad";
import { directivaParaAvisar } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { suspenderAperturaAutomatica } from "@/modulos/identidad/aplicacion/visitas";

/** Una alerta del sistema para la directiva (DIR-INI-02): un solo aviso por corrida del worker, no uno por casa. */
const avisarALaDirectiva = (tx: Transaccion, directiva: string[], titulo: string, texto: string) =>
  encolarAvisos(
    directiva.map((destinatarioId) => ({ destinatarioId, tipo: "PAGOS" as const, titulo, texto })),
    tx,
  );

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
    const directiva = await directivaParaAvisar();
    await prisma.$transaction(async (tx) => {
      await registrarAuditoria(
        {
          actorId: null,
          accion: "alertar_morosidad",
          entidad: "Ciclo",
          entidadId: lunesDe(ahora),
          antes: null,
          despues: { recordatorios: alertas },
        },
        tx,
      );
      await avisarALaDirectiva(
        tx,
        directiva,
        "Recordatorios de cuota enviados",
        textoDeRecordatorios(alertas),
      );
    });
  }
  return { casas: candidatas.length, alertas };
}

/**
 * Tarea del worker (HU-COB-06): a las 8 semanas seguidas de impago, la casa pasa a atraso crítico. Para cada casa cuya cuota
 * impaga más antigua lleva 8 semanas o más desde su fecha límite, en una sola transacción: sincroniza el padrón de garita
 * (la reja deja de abrirse sola, CA2), avisa a sus residentes con una notificación formal de seguridad que no se puede
 * desactivar y dice cómo regularizar (CA3), y lo deja en la auditoría. No cobra nada de más ni toca las cuotas. Idempotente:
 * el cambio de semáforo es un UPDATE condicionado, así que una casa ya suspendida no se vuelve a avisar, y correrla dos
 * veces a la vez avisa una sola. Ponerla al día la restituye (HU-COB-07 y los pagos aprobados), no esta tarea.
 */
export async function suspenderCasasConAtrasoCritico(ahora = new Date()) {
  const porCasa = await cuotasImpagasPorCasa();
  const criticas = [...porCasa].filter(
    ([, impagas]) => clasificarMorosidad(impagas, ahora) === "MOROSO_CRITICO",
  );
  if (!criticas.length) return { casas: 0, suspendidas: 0 };

  const casas = await casasDe(criticas.map(([predioId]) => predioId));
  let suspendidas = 0;
  for (const [predioId, impagas] of criticas) {
    const casa = casas.get(predioId);
    if (!casa || casa.estadoGarita === "ROJO" || !casa.residentes.length) continue;
    const debe = impagas.reduce((suma, c) => suma + c.saldoPendiente, 0);
    const semanas = impagas.length;
    const cambio = await prisma.$transaction(async (tx) => {
      if (!(await suspenderAperturaAutomatica(predioId, tx))) return false;
      await encolarAvisos(
        casa.residentes.map((destinatarioId) => ({
          destinatarioId,
          tipo: "SEGURIDAD" as const,
          titulo: "Por ahora la reja no se abre sola",
          texto: `Su casa lleva ${semanas} semanas pendientes de pago (hoy debe ${soles(debe)}). Por eso el vigilante ya no abre la reja automáticamente: usted puede entrar abriéndola a mano, como siempre, y por ahora no puede registrar visitas nuevas. Para volver a la normalidad, pague lo pendiente por la app o en efectivo; apenas la directiva lo valide, la reja vuelve a abrirse sola. Si no puede pagarlo todo junto, converse con la directiva.`,
        })),
        tx,
      );
      await registrarAuditoria(
        {
          actorId: null,
          accion: "clasificar_morosidad",
          entidad: "Predio",
          entidadId: predioId,
          antes: { garita: "La reja se abre sola" },
          despues: {
            estado: "Atraso crítico",
            semanas,
            debe: soles(debe),
            garita: "La reja no se abre sola",
          },
        },
        tx,
      );
      return true;
    });
    if (cambio) suspendidas += 1;
  }
  if (suspendidas) {
    const directiva = await directivaParaAvisar();
    await prisma.$transaction((tx) =>
      avisarALaDirectiva(tx, directiva, "Casas con 8 semanas sin pago", textoDeSuspensiones(suspendidas)),
    );
  }
  return { casas: criticas.length, suspendidas };
}

/**
 * «Por ahora la reja no se abre sola» (VEC-COB-12): lo que pasa con la reja de su casa, cuánto debe y desde cuándo, y cómo
 * volver a la normalidad. Solo ve su casa (AC-7). `null` si no figura como residente de una casa.
 */
export async function miReja(sesion: SesionDto) {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) return null;
  const cuotas = await cuotasPorPagarDe(casa.id);
  return {
    suspendida: casa.estadoGarita === "ROJO",
    semanas: cuotas.length,
    debe: cuotas.reduce((suma, c) => suma + c.saldoPendiente, 0),
    detalle: textoDeSemanas(cuotas.map((c) => c.periodo)),
    umbral: SEMANAS_PARA_CRITICO,
  };
}

export type MiReja = NonNullable<Awaited<ReturnType<typeof miReja>>>;
