// @HU-COB-01
import { Prisma } from "@/compartido/bd/generado/client";
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { soles } from "@/compartido/dinero";
import { fechaEnFrase } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { conceptosDe } from "@/modulos/aportes/aplicacion/tarifa";
import {
  calcularCuota,
  etiquetaDeSemana,
  fechaLimiteDe,
  inicioDeSemana,
  lunesDe,
  periodosPorEmitir,
} from "@/modulos/aportes/dominio/cuota";
import { separarVersiones } from "@/modulos/aportes/dominio/tarifa";
import {
  crearCuota,
  cuotasPagadasDe,
  cuotasPorPagarDe,
  marcarVencidas,
  ultimaCuotaDe,
  ultimoPeriodoPorCasa,
} from "@/modulos/aportes/infraestructura/repositorioCuotas";
import { versionesDeTarifa } from "@/modulos/aportes/infraestructura/repositorioTarifa";
import { ocupacionDeLasCasas, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/**
 * Tarea del worker (HU-COB-01): emite la cuota de la semana de cada casa y avisa a sus vecinos. Calcula el saldo
 * exigible con la tarifa vigente de esa semana y la ocupación registrada (CA1), guarda la cuota con una copia de los
 * conceptos y montos —con su fecha, queda la traza temporal (CA3)— y despacha el aviso de cobro (CA2). Idempotente
 * por casa y semana (UNIQUE): correrla varias veces, o dos a la vez, no duplica ni avisa dos veces. Si el worker no
 * corrió alguna semana, la recupera sin avisar de lo viejo. Marca como vencidas las que ya pasaron su fecha límite.
 */
export async function calcularDeuda(ahora = new Date()) {
  const vencidas = await marcarVencidas(ahora);
  const versiones = await versionesDeTarifa();
  if (!versiones.length) return { cuotas: 0, avisos: 0, vencidas };

  const actual = lunesDe(ahora);
  const [casas, ultimos] = await Promise.all([ocupacionDeLasCasas(), ultimoPeriodoPorCasa()]);
  let cuotas = 0;
  let avisos = 0;
  for (const casa of casas) {
    const ultimo = ultimos.get(casa.predioId);
    for (const periodo of periodosPorEmitir(ultimo ? lunesDe(ultimo) : null, actual)) {
      const inicio = inicioDeSemana(periodo);
      const { vigente } = separarVersiones(versiones, inicio);
      if (!vigente) continue;
      const { lineas, total } = calcularCuota(conceptosDe(vigente), casa.ocupacion);
      if (!total) continue;
      const fechaLimite = fechaLimiteDe(periodo);
      try {
        await prisma.$transaction(async (tx) => {
          await crearCuota(tx, {
            predioId: casa.predioId,
            periodo: inicio,
            fechaLimite,
            tarifaId: vigente.id,
            monto: total,
            lineas,
          });
          if (periodo !== actual) return;
          const { cantidad } = await encolarAvisos(
            casa.vecinos.map((destinatarioId) => ({
              destinatarioId,
              tipo: "PAGOS" as const,
              titulo: `Su cuota de la semana: ${soles(total)}`,
              texto: `${etiquetaDeSemana(periodo)}. Puede pagarla hasta el ${fechaEnFrase(fechaLimite)}. Véala en Mi cuota.`,
            })),
            tx,
          );
          avisos += cantidad;
        });
        cuotas += 1;
      } catch (error) {
        // Otra ejecución la emitió a la vez: ya está, no se repite (UNIQUE casa y semana).
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      }
    }
  }
  if (cuotas) {
    await prisma.$transaction((tx) =>
      registrarAuditoria(
        {
          actorId: null,
          accion: "calcular_deuda",
          entidad: "Ciclo",
          entidadId: actual,
          antes: null,
          despues: { semana: etiquetaDeSemana(actual), cuotas, avisos },
        },
        tx,
      ),
    );
  }
  return { cuotas, avisos, vencidas };
}

const ESTADO_EN_TEXTO = {
  PENDIENTE: "Pendiente",
  VENCIDA: "Con retraso",
  EN_DISCREPANCIA: "En revisión",
  PAGADA: "Pagada",
} as const;

/**
 * El estado de cuenta de la casa (HU-COB-02, VEC-COB-01 y VEC-COB-05): lo que debe hoy semana por semana, lo ya pagado
 * y cómo se calcula su cuota semanal, con los conceptos de su última cuota (HU-COB-01 CA1). Se lee en cada consulta, así
 * un abono nuevo se ve de inmediato (CA3). Solo ve su casa (AC-7): el predio sale de su sesión, no de la petición.
 */
export async function miCuota(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) return null;
  const [pendientes, pagadas, ultima] = await Promise.all([
    cuotasPorPagarDe(casa.id),
    cuotasPagadasDe(casa.id),
    ultimaCuotaDe(casa.id),
  ]);
  return {
    vivienda: casa.vivienda,
    debe: pendientes.reduce((suma, c) => suma + c.saldoPendiente, 0),
    semanas: pendientes.map((c) => ({
      id: c.id,
      semana: etiquetaDeSemana(lunesDe(c.periodo)),
      estado: ESTADO_EN_TEXTO[c.estado],
      monto: c.saldoPendiente,
      // Lo que ya abonó de esa semana, si pagó una parte.
      pagado: c.montoCalculado - c.saldoPendiente,
    })),
    historial: pagadas.map((c) => ({
      id: c.id,
      semana: etiquetaDeSemana(lunesDe(c.periodo)),
      monto: c.montoCalculado,
    })),
    porSemana: ultima?.montoCalculado ?? 0,
    conceptos: (ultima?.conceptos ?? []).map((l) => ({
      clave: l.clave,
      nombre: l.nombre,
      unidad: l.unidad,
      cantidad: l.cantidad,
      monto: l.subtotal,
    })),
  };
}

export type MiCuotaDto = NonNullable<Awaited<ReturnType<typeof miCuota>>>;
