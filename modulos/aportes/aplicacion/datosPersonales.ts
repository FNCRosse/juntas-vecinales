// @HU-GAR-12 @HU-GAR-14
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import type { Transaccion } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { fechaCorta } from "@/compartido/fechas";
import { MEDIOS, numeroDeConstancia } from "@/modulos/aportes/dominio/pago";
import { numeroDePedidoDeCobro } from "@/modulos/aportes/dominio/cobro";
import { FRANJAS, numeroDePedido, numeroDeRecibo } from "@/modulos/aportes/dominio/recibo";
import { MOTIVOS, numeroDeReclamo } from "@/modulos/aportes/dominio/reclamo";
import { anonimizarDe, datosDe } from "@/modulos/aportes/infraestructura/repositorioArco";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { ESTADO_EN_TEXTO as ESTADO_DE_PAGO } from "./pagos";
import { ESTADO_EN_TEXTO as ESTADO_DE_RECLAMO } from "./reclamos";

type Fila = [string, string];

const ESTADO_DE_COBRO = { PENDIENTE: "Pendiente", COBRADO: "Cobrado", CANCELADO: "Cancelado" };
const ESTADO_DE_ENTREGA = { POR_ENTREGAR: "Por entregar", ENTREGADO: "Entregado" };
const nota = (texto: string | null) => (texto ? [`nota: «${texto}»`] : []);

/**
 * La sección de aportes de la copia de datos (HU-GAR-12 CA1): lo que debe su casa, sus pagos, los recibos con su nombre, sus
 * reclamos y sus pedidos de cobro en casa y de recibo en papel. Solo de su casa: nada de otros vecinos, ni lo que la directiva
 * cobró en otras casas (CA3).
 */
export async function datosPersonales(usuarioId: string): Promise<SeccionPdf[]> {
  const predio = await predioDelVecino(usuarioId);
  const nombre = (await nombresDe([usuarioId])).get(usuarioId) ?? "";
  const d = await datosDe(usuarioId, nombre, predio?.id ?? null);
  const debe = d.cuotas.reduce((suma, c) => suma + c.saldoPendiente, 0);
  const filas: Fila[] = [
    [
      "Cuotas de su casa",
      d.cuotas.length
        ? `${d.cuotas.length} ${d.cuotas.length === 1 ? "semana pendiente" : "semanas pendientes"} · debe ${soles(debe)}`
        : d.hayCuotas
          ? "Al día"
          : "Sin cuotas emitidas",
    ],
    ...d.pagos.map((p): Fila => [
      `Pago ${numeroDeConstancia(p.numero)} del ${fechaCorta(p.creadoEn)}`,
      `${MEDIOS[p.medio]} · ${soles(p.monto)} · ${ESTADO_DE_PAGO[p.estado]}`,
    ]),
    ...d.recibos.map((r): Fila => [
      `Recibo ${numeroDeRecibo(r.numero)} del ${fechaCorta(r.fecha)}`,
      `${soles(r.monto)} · ${r.concepto}`,
    ]),
    ...d.reclamos.map((r): Fila => [
      `Reclamo ${numeroDeReclamo(r.numero)} del ${fechaCorta(r.creadoEn)}`,
      [
        `${MOTIVOS[r.motivo]}${r.detalle ? `: «${r.detalle}»` : ""}`,
        ESTADO_DE_RECLAMO[r.estado],
        ...(r.respuesta ? [`respuesta: «${r.respuesta}»`] : []),
      ].join(" · "),
    ]),
    ...d.pedidosDeCobro.map((p): Fila => [
      `Pedido de cobro en casa ${numeroDePedidoDeCobro(p.numero)} del ${fechaCorta(p.creadoEn)}`,
      [
        `${p.semanas} ${p.semanas === 1 ? "semana" : "semanas"}`,
        soles(p.monto),
        FRANJAS[p.franja].resumen,
        ESTADO_DE_COBRO[p.estado],
        ...nota(p.nota),
      ].join(" · "),
    ]),
    ...d.pedidosDeRecibo.map((p): Fila => [
      `Pedido de recibo en papel ${numeroDePedido(p.numero)} del ${fechaCorta(p.creadoEn)}`,
      [p.franja ? FRANJAS[p.franja].resumen : null, ESTADO_DE_ENTREGA[p.estado], ...nota(p.nota)]
        .filter(Boolean)
        .join(" · "),
    ]),
  ];
  return [{ titulo: "Cuotas, pagos y recibos", filas }];
}

/** La parte de aportes de una cancelación aprobada (HU-GAR-14 CA3), en la transacción de identidad. */
export async function anonimizar(usuarioId: string, tx: Transaccion) {
  const [predio, nombres] = await Promise.all([predioDelVecino(usuarioId), nombresDe([usuarioId])]);
  await anonimizarDe(tx, usuarioId, nombres.get(usuarioId) ?? "", predio?.id ?? null);
}
