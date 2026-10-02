import type { Transaccion } from "@/compartido/bd/cliente";

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
