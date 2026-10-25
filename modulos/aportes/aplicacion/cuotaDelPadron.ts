// @HU-COB-16 @HU-GAR-10
import type { Transaccion } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { fechaLarga } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { calcularCuota, inicioDeSemana, lunesDe, sumarDias } from "@/modulos/aportes/dominio/cuota";
import { separarVersiones } from "@/modulos/aportes/dominio/tarifa";
import { ultimaCuotaDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import { versionesDeTarifa } from "@/modulos/aportes/infraestructura/repositorioTarifa";
import { casasDe } from "@/modulos/identidad/aplicacion/comunidad";
import { conceptosDe } from "./tarifa";

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/**
 * La tarifa con la que se cobra desde el siguiente ciclo (HU-COB-16 CA1): la lista de conceptos y montos que ve el
 * administrador al empadronar o actualizar un predio, y el lunes desde el que rige. Si la asamblea programó un cambio para
 * ese lunes, ya cuenta.
 */
export async function tarifaDelPadron(ahora = new Date()) {
  const lunes = sumarDias(lunesDe(ahora), 7);
  const { vigente } = separarVersiones(await versionesDeTarifa(), inicioDeSemana(lunes));
  return {
    conceptos: conceptosDe(vigente),
    desde: fechaLarga(inicioDeSemana(lunes)),
  };
}

/** Lo que paga hoy la casa por semana: el monto de su última cuota emitida; `null` si todavía no tiene. */
export async function cuotaDeHoy(predioId: string) {
  return (await ultimaCuotaDe(predioId))?.montoCalculado ?? null;
}

/**
 * Avisa a los residentes de la casa su cuota nueva cuando el administrador cambia la ocupación de su predio (HU-GAR-10 CA2,
 * ADM-PAD-09), en la misma transacción del cambio. La cuota de esta semana no cambia: las que vienen se calculan con la
 * ocupación nueva y la tarifa del siguiente ciclo. No avisa si el monto es el mismo o si la casa todavía no tenía cuota.
 */
export async function avisarCuotaNueva(
  tx: Transaccion,
  predioId: string,
  hoy: number | null,
  ocupacion: Record<string, number>,
  ahora = new Date(),
) {
  if (hoy === null) return;
  const { conceptos, desde } = await tarifaDelPadron(ahora);
  const nueva = calcularCuota(conceptos, ocupacion).total;
  if (nueva === hoy) return;
  const residentes = (await casasDe([predioId])).get(predioId)?.residentes ?? [];
  await encolarAvisos(
    residentes.map((destinatarioId) => ({
      destinatarioId,
      tipo: "PAGOS" as const,
      titulo: "Su cuota semanal va a cambiar",
      texto: `Actualizamos los datos de su vivienda. Desde el ${minuscula(desde).replace(/ de \d{4}$/, "")} su cuota será de ${soles(nueva)} por semana.`,
    })),
    tx,
  );
}
