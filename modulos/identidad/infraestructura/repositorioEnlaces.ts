import { prisma, type Transaccion } from "@/compartido/bd/cliente";

/** Guarda un enlace nuevo y anula los vigentes de esa persona: solo sirve el último (R-01). */
export async function guardarEnlace(
  tx: Transaccion,
  enlace: { usuarioId: string; tokenHash: string; emitidoEn: Date; expiraEn: Date },
) {
  await tx.magicLink.updateMany({
    where: { usuarioId: enlace.usuarioId, usadoEn: null, anuladoEn: null },
    data: { anuladoEn: enlace.emitidoEn },
  });
  return tx.magicLink.create({ data: enlace });
}

/** El enlace con su dueño y la vivienda donde vive, para la pantalla de bienvenida. */
export async function buscarEnlacePorHash(tokenHash: string) {
  return prisma.magicLink.findUnique({
    where: { tokenHash },
    include: {
      usuario: { include: { residencias: { where: { fechaFin: null }, include: { predio: true } } } },
    },
  });
}

/**
 * Bloquea la fila del enlace hasta el fin de la transacción (SELECT … FOR UPDATE): si se abre dos
 * veces a la vez, la segunda espera y ya lo encuentra usado.
 */
export async function bloquearEnlace(tx: Transaccion, tokenHash: string) {
  const [fila] = await tx.$queryRaw<
    { id: string; usuarioId: string; usadoEn: Date | null; anuladoEn: Date | null; expiraEn: Date }[]
  >`SELECT id, "usuarioId", "usadoEn", "anuladoEn", "expiraEn" FROM identidad_enlaces_acceso
    WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
  return fila ?? null;
}

export async function marcarEnlaceUsado(tx: Transaccion, id: string, ahora: Date) {
  await tx.magicLink.update({ where: { id }, data: { usadoEn: ahora } });
}
