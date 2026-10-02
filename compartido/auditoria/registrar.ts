import type { Transaccion } from "../bd/cliente";
import type { Prisma } from "../bd/generado/client";

export type EntradaAuditoria = {
  /** Id del usuario que actúa; null cuando lo hace el sistema (worker). */
  actorId: string | null;
  /** Verbo en infinitivo y snake_case: "aprobar_comprobante", "cambiar_rol". */
  accion: string;
  /** Clase del dominio afectada: "Cuota", "Usuario". */
  entidad: string;
  entidadId: string;
  /** Valores previos y posteriores; null cuando no existían (alta) o dejan de existir (baja). */
  antes: Prisma.InputJsonValue | null;
  despues: Prisma.InputJsonValue | null;
};

/**
 * Registra una acción crítica en `nucleo_auditoria` (AC-6). Exige la transacción del caso de uso:
 * si la acción se deshace, su auditoría también, y nunca queda una sin la otra.
 */
export async function registrarAuditoria(entrada: EntradaAuditoria, tx: Transaccion) {
  const { antes, despues, ...resto } = entrada;
  const fila = await tx.registroAuditoria.create({
    data: { ...resto, antes: antes ?? undefined, despues: despues ?? undefined },
  });
  return { id: fila.id, fecha: fila.fecha };
}
