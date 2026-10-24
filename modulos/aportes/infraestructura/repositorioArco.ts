// @HU-GAR-12 @HU-GAR-14
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

/** El nombre que reemplaza al de una persona que canceló su cuenta: el mismo que usa identidad, y el único que admite el trigger de los recibos. */
export const NOMBRE_ANONIMO = "Persona anonimizada";
export const TEXTO_ELIMINADO = "Texto eliminado por la cancelación de la cuenta.";

/** Los recibos que llevan el nombre de esa persona en su casa: el titular que imprimió el papel. */
const recibosConSuNombre = (nombre: string, predioId: string) => ({ titular: nombre, predioId });

/**
 * Todo lo que M5 guarda de una persona (HU-GAR-12 CA1): lo que mandó o pidió ella, y los recibos con su nombre. Solo de su casa:
 * lo que la directiva cobró o aprobó en otras casas no es suyo (CA3).
 */
export async function datosDe(usuarioId: string, nombre: string, predioId: string | null) {
  const [cuotas, pagos, recibos, reclamos, pedidosDeCobro, pedidosDeRecibo] = await Promise.all([
    predioId
      ? prisma.cuota.findMany({ where: { predioId, saldoPendiente: { gt: 0 }, estado: { not: "PAGADA" } } })
      : [],
    predioId
      ? prisma.pago.findMany({ where: { autorId: usuarioId, predioId }, orderBy: { numero: "asc" } })
      : [],
    predioId
      ? prisma.recibo.findMany({ where: recibosConSuNombre(nombre, predioId), orderBy: { numero: "asc" } })
      : [],
    prisma.solicitudAjusteTarifa.findMany({
      where: { solicitanteId: usuarioId },
      orderBy: { numero: "asc" },
    }),
    prisma.pedidoCobroEnCasa.findMany({ where: { solicitanteId: usuarioId }, orderBy: { numero: "asc" } }),
    prisma.pedidoReciboPapel.findMany({ where: { solicitanteId: usuarioId }, orderBy: { numero: "asc" } }),
  ]);
  const hayCuotas = predioId ? (await prisma.cuota.count({ where: { predioId } })) > 0 : false;
  return { cuotas, hayCuotas, pagos, recibos, reclamos, pedidosDeCobro, pedidosDeRecibo };
}

/**
 * Anonimiza lo de M5 de una persona (HU-GAR-14 CA3). Los pagos, los recibos y los reclamos se conservan: son el registro
 * contable de la junta, y siguen apuntando al usuario ya anonimizado. Se quita el nombre de los recibos (el que pagó y, si
 * fue ella quien cobró, el de quien cobró) y lo que escribió a mano: el detalle de un reclamo y las notas de sus pedidos.
 * Los comprobantes que subió se conservan como respaldo de esos pagos.
 */
export async function anonimizarDe(
  tx: Transaccion,
  usuarioId: string,
  nombre: string,
  predioId: string | null,
) {
  if (predioId) {
    await tx.recibo.updateMany({
      where: recibosConSuNombre(nombre, predioId),
      data: { titular: NOMBRE_ANONIMO },
    });
  }
  await tx.recibo.updateMany({
    where: { registradoPorId: usuarioId },
    data: { registradoPor: NOMBRE_ANONIMO },
  });
  const propias = { solicitanteId: usuarioId, NOT: { nota: null } };
  await tx.solicitudAjusteTarifa.updateMany({
    where: { solicitanteId: usuarioId, NOT: { detalle: null } },
    data: { detalle: TEXTO_ELIMINADO },
  });
  await tx.pedidoCobroEnCasa.updateMany({ where: propias, data: { nota: TEXTO_ELIMINADO } });
  await tx.pedidoReciboPapel.updateMany({ where: propias, data: { nota: TEXTO_ELIMINADO } });
}
