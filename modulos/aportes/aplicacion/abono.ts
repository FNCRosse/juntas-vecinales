// @HU-COB-09 @HU-COB-11 @HU-COB-07
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import type { Transaccion } from "@/compartido/bd/cliente";
import type { MedioDePago } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { aplicarAbono } from "@/modulos/aportes/dominio/cuota";
import { clasificarMorosidad } from "@/modulos/aportes/dominio/morosidad";
import { MEDIOS, numeroDeConstancia } from "@/modulos/aportes/dominio/pago";
import { numeroDeRecibo } from "@/modulos/aportes/dominio/recibo";
import { cuotasImpagasDe } from "@/modulos/aportes/infraestructura/repositorioPagos";
import { crearRecibo } from "@/modulos/aportes/infraestructura/repositorioRecibos";
import { actualizarEstadoMorosidad } from "@/modulos/identidad/aplicacion/visitas";

/**
 * Lo que pasa cuando un pago queda aprobado, venga de un comprobante revisado (HU-COB-09) o de efectivo que cobra la
 * directiva en la casa (HU-COB-11): el abono se aplica a las cuotas que cubría, la garita se restituye si ya no hay
 * atraso crítico (R-05), se emite el recibo oficial (HU-COB-12), se avisa a quien pagó y se audita. Todo en la
 * transacción de quien llama, que ya reclamó el cambio de estado (AC-5). Devuelve lo que debe la casa y el recibo.
 */
export async function aplicarPagoAprobado(
  tx: Transaccion,
  datos: {
    pago: { id: string; numero: number; predioId: string; monto: number; medio: MedioDePago };
    partes: { cuotaId: string; monto: number }[];
    titular: string;
    vivienda: string;
    concepto: string;
    registradoPor: { id: string; nombre: string };
    /** Cuándo se recibió el dinero (la fecha del recibo). */
    fecha: Date;
    /** Cuándo se registra, para medir el atraso. */
    ahora: Date;
    avisarA: string[];
    accion: string;
    /** El recibo llega a la app de inmediato (cobro en casa) o lo envía la directiva después (comprobante). */
    enviarRecibo: boolean;
    /** Lo recibido que no cabía en las cuotas por pagar. */
    excedente?: number;
    /** Cómo se dice el medio en el recibo, si no es el de siempre (por ejemplo, con el número de operación). */
    medioTexto?: string;
    /** Algo más que decirle a quien pagó, al final del aviso («La reja vuelve a abrirse sola»). */
    avisoExtra?: string;
  },
) {
  const { pago } = datos;
  for (const parte of datos.partes) {
    const cuota = await tx.cuota.findUniqueOrThrow({ where: { id: parte.cuotaId } });
    if (cuota.estado === "PAGADA") continue;
    const { saldo, estado } = aplicarAbono(
      cuota.saldoPendiente,
      parte.monto,
      cuota.estado as "PENDIENTE" | "VENCIDA" | "EN_DISCREPANCIA",
    );
    await tx.cuota.update({ where: { id: cuota.id }, data: { saldoPendiente: saldo, estado } });
  }
  const impagas = await cuotasImpagasDe(tx, pago.predioId);
  const debe = impagas.reduce((suma, c) => suma + c.saldoPendiente, 0);
  // El recibo oficial nace con el pago aprobado y guarda lo que dice el papel (HU-COB-12 CA1).
  const recibo = await crearRecibo(tx, {
    pagoId: pago.id,
    predioId: pago.predioId,
    titular: datos.titular,
    vivienda: datos.vivienda,
    concepto: datos.concepto,
    medio: datos.medioTexto ?? MEDIOS[pago.medio],
    monto: pago.monto,
    fecha: datos.fecha,
    registradoPor: datos.registradoPor.nombre,
    registradoPorId: datos.registradoPor.id,
    enviadoEn: datos.enviarRecibo ? datos.ahora : undefined,
  });
  // Solo se restituye la garita si ya no hay atraso crítico; suspenderla es de la tarea de morosidad (HU-COB-06).
  if (clasificarMorosidad(impagas, datos.ahora) !== "MOROSO_CRITICO") {
    await actualizarEstadoMorosidad(pago.predioId, "VERDE", tx);
  }
  const estadoDeCuenta =
    debe === 0
      ? "Ya está al día. Gracias."
      : `Todavía le faltan ${soles(debe)} de su cuota. Puede pagarlo cuando pueda.`;
  const aviso = datos.enviarRecibo
    ? `${estadoDeCuenta} Su recibo N.° ${numeroDeRecibo(recibo.numero)} ya está en Mis pagos y recibos.`
    : estadoDeCuenta;
  await encolarAvisos(
    datos.avisarA.map((destinatarioId) => ({
      destinatarioId,
      tipo: "PAGOS" as const,
      titulo: "Su pago fue aprobado",
      texto: `Recibimos su pago de ${soles(pago.monto)}. ${aviso}${datos.avisoExtra ? ` ${datos.avisoExtra}` : ""}`,
    })),
    tx,
  );
  await registrarAuditoria(
    {
      actorId: datos.registradoPor.id,
      accion: datos.accion,
      entidad: "Pago",
      entidadId: pago.id,
      antes: null,
      despues: {
        constancia: numeroDeConstancia(pago.numero),
        monto: soles(pago.monto),
        debeAhora: soles(debe),
        recibo: numeroDeRecibo(recibo.numero),
        ...(datos.excedente ? { excedente: soles(datos.excedente) } : {}),
      },
    },
    tx,
  );
  return { debe, recibo };
}
