import type { Transaccion } from "@/compartido/bd/cliente";
import type { TipoAviso } from "@/compartido/bd/generado/client";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { vecinosDeLaComunidad } from "@/modulos/identidad/aplicacion/comunidad";

/**
 * Encola un aviso para cada vecino activo, dentro de la transacción de la publicación (ADR-006): si se
 * deshace la publicación, los avisos también. Devuelve a cuántos se avisó.
 */
export async function avisarALaComunidad(
  aviso: { tipo: TipoAviso; titulo: string; texto: string },
  tx: Transaccion,
) {
  const destinatarios = await vecinosDeLaComunidad(tx);
  await encolarAvisos(
    destinatarios.map((destinatarioId) => ({ destinatarioId, ...aviso })),
    tx,
  );
  return destinatarios.length;
}
