import type { Transaccion } from "../bd/cliente";

export type AvisoNuevo = {
  /** Id del usuario que recibe el aviso. */
  destinatarioId: string;
  /** Lo que se ve en el centro de notificaciones, con trato de usted. */
  titulo: string;
  texto: string;
  /** Canal externo, si su preferencia lo permite (HU-GAR-18). Sin él, solo copia interna. */
  whatsapp?: { telefono: string; plantilla: string; parametros: string[] };
};

/**
 * Encola un aviso dentro de la transacción del caso de uso (ADR-006): si la acción se deshace,
 * el aviso también. El despacho lo hace el worker.
 */
export async function encolarAviso(aviso: AvisoNuevo, tx: Transaccion) {
  const { whatsapp, ...resto } = aviso;
  const fila = await tx.avisoEnCola.create({
    data: {
      ...resto,
      telefono: whatsapp?.telefono,
      plantilla: whatsapp?.plantilla,
      parametros: whatsapp?.parametros ?? [],
    },
  });
  return { id: fila.id };
}
