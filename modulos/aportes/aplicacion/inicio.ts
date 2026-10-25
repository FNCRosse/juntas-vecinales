// @HU-GAR-19
import { textoDeSemanas } from "@/modulos/aportes/dominio/pago";
import { contarPorAtender } from "@/modulos/aportes/infraestructura/repositorioInicio";
import { cuotasPorPagarDe, ultimaCuotaDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import { reclamoEnRevisionDe } from "@/modulos/aportes/infraestructura/repositorioReclamos";
import { cuotasEnRevision } from "@/modulos/aportes/infraestructura/repositorioPagos";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

/**
 * Lo que el inicio del vecino muestra de M5 sin que tenga que navegar (HU-GAR-19, AC-2): lo que paga por semana, lo que debe y
 * desde cuándo, si lo pendiente ya está en un pago que revisa la directiva, si la reja no se abre sola y si tiene un reclamo en
 * revisión. Solo de su casa (AC-7): sale de su sesión. Se lee en cada carga, así cambia al pagar (CA3).
 */
export async function bloqueDeCuota(sesion: SesionDto) {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) return null;
  const [pendientes, ultima, reclamo] = await Promise.all([
    cuotasPorPagarDe(casa.id),
    ultimaCuotaDe(casa.id),
    reclamoEnRevisionDe(casa.id),
  ]);
  const enRevision = await cuotasEnRevision(pendientes.map((c) => c.id));
  const debe = pendientes.reduce((suma, c) => suma + c.saldoPendiente, 0);
  return {
    porSemana: ultima?.montoCalculado ?? 0,
    debe,
    semanas: pendientes.length,
    rango: pendientes.length ? textoDeSemanas(pendientes.map((c) => c.periodo)) : null,
    estado: !ultima
      ? ("SIN_CUOTAS" as const)
      : !pendientes.length
        ? ("AL_DIA" as const)
        : pendientes.every((c) => enRevision.has(c.id))
          ? ("EN_REVISION" as const)
          : ("PENDIENTE" as const),
    rejaSuspendida: casa.estadoGarita === "ROJO",
    reclamo: reclamo !== null,
  };
}

/**
 * Lo que espera a la directiva en cobros (DIR-INI-01): comprobantes por revisar, cobros en casa, reclamos de cuota y recibos
 * en papel. Los cuatro números salen de lo mismo que lista Cobros. Lo ven la directiva y el mediador.
 */
export async function bandejaDeCobros(sesion: SesionDto) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const cuentas = await contarPorAtender();
  return { ...cuentas, total: Object.values(cuentas).reduce((suma, n) => suma + n, 0) };
}
