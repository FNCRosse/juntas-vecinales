import type { Transaccion } from "../bd/cliente";
import type { TipoAviso } from "../bd/generado/client";

export type AvisoNuevo = {
  /** Id del usuario que recibe el aviso. */
  destinatarioId: string;
  /** De qué trata; por defecto, de su cuenta (acceso y clave), que sale siempre. */
  tipo?: TipoAviso;
  /** Lo que se ve en el centro de notificaciones, con trato de usted. */
  titulo: string;
  texto: string;
  /** Canal externo, si su preferencia lo permite (HU-GAR-18). Sin él, solo copia interna. */
  whatsapp?: { telefono: string; plantilla: string; parametros: string[] };
  /** Falso solo cuando otro aviso del mismo hecho ya deja la copia interna (el número anterior). */
  conCopiaInterna?: boolean;
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

/** Encola el mismo aviso para muchas personas (un comunicado a toda la comunidad) en un solo envío a la BD. */
export async function encolarAvisos(avisos: AvisoNuevo[], tx: Transaccion) {
  const { count } = await tx.avisoEnCola.createMany({
    data: avisos.map(({ whatsapp, ...resto }) => ({
      ...resto,
      telefono: whatsapp?.telefono,
      plantilla: whatsapp?.plantilla,
      parametros: whatsapp?.parametros ?? [],
    })),
  });
  return { cantidad: count };
}
