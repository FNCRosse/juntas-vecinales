import { prisma } from "./bd/cliente";

// Plazos de retención (docs/DATOS.md §6, Ley N.° 29733): valores propuestos hasta que la directiva
// acuerde otros. Se cambian solo aquí. El worker depura en cada ejecución; cada módulo que guarde un
// dato con plazo agrega aquí su borrado.

export const RETENCION_DIAS = {
  /** Bitácora de la garita y visitas: 1 año. */
  garita: 365,
  /** Enlaces de acceso y sesiones vencidas: 30 días después de vencer. */
  accesosVencidos: 30,
} as const;

/** Cuánto vive la cookie de sesión si no se usa (el máximo del navegador). */
export const VIDA_SESION_DIAS = 400;

export const haceDias = (ahora: Date, dias: number) => new Date(ahora.getTime() - dias * 24 * 3_600_000);

/**
 * Borra lo que pasó su plazo: bitácora y visitas de más de un año (el trigger de la bitácora solo deja
 * borrar esas filas) y enlaces y sesiones vencidos hace más de 30 días.
 */
export async function depurarVencidos(ahora = new Date()) {
  const garita = haceDias(ahora, RETENCION_DIAS.garita);
  const accesos = haceDias(ahora, RETENCION_DIAS.accesosVencidos);
  const sinUso = haceDias(ahora, VIDA_SESION_DIAS + RETENCION_DIAS.accesosVencidos);
  const [bitacora, visitas, enlaces, sesiones] = await Promise.all([
    prisma.registroAcceso.deleteMany({ where: { fecha: { lt: garita } } }),
    prisma.visita.deleteMany({ where: { hasta: { lt: garita } } }),
    prisma.magicLink.deleteMany({ where: { expiraEn: { lt: accesos } } }),
    prisma.sesion.deleteMany({
      where: { OR: [{ revocadaEn: { lt: accesos } }, { ultimoUsoEn: { lt: sinUso } }] },
    }),
  ]);
  return {
    bitacora: bitacora.count,
    visitas: visitas.count,
    enlaces: enlaces.count,
    sesiones: sesiones.count,
  };
}
