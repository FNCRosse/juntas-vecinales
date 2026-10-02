import { prisma } from "../bd/cliente";
import type { AvisoEnCola } from "../bd/generado/client";
import { leerPreferencias, saleAlWhatsApp } from "./preferencias";
import { type CanalWhatsApp, elegirCanal } from "./whatsapp";

/** Espera antes de cada reintento, en minutos: tras el 1.er, 2.º y 3.er fallo (BACKEND.md §8). */
export const ESPERAS_MIN = [1, 4, 16];
const MAX_INTENTOS = ESPERAS_MIN.length + 1;
const LOTE = 20;

export type ResumenDespacho = { enviados: number; sinCanal: number; reintentos: number; fallidos: number };

/**
 * Reclama un lote con FOR UPDATE SKIP LOCKED. Reclamar suma el intento y corre `reintentarDesde`
 * a la siguiente espera: si el worker se cae a mitad del envío, el aviso vuelve solo a la cola.
 */
async function reclamarLote(ahora: Date): Promise<AvisoEnCola[]> {
  return prisma.$queryRaw<AvisoEnCola[]>`
    UPDATE nucleo_cola_avisos AS c
    SET intentos = c.intentos + 1,
        "reintentarDesde" = ${ahora}::timestamp + make_interval(mins =>
          (${ESPERAS_MIN}::int[])[LEAST(c.intentos + 1, ${ESPERAS_MIN.length})])
    WHERE c.id IN (
      SELECT id FROM nucleo_cola_avisos
      WHERE estado = 'PENDIENTE' AND "reintentarDesde" <= ${ahora}
      ORDER BY "creadoEn"
      LIMIT ${LOTE}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING c.*`;
}

/** La copia interna se escribe antes de intentar WhatsApp y una sola vez por aviso. */
async function escribirCopiaInterna(aviso: AvisoEnCola) {
  if (!aviso.conCopiaInterna) return;
  await prisma.notificacion.upsert({
    where: { avisoId: aviso.id },
    create: {
      avisoId: aviso.id,
      destinatarioId: aviso.destinatarioId,
      tipo: aviso.tipo,
      titulo: aviso.titulo,
      texto: aviso.texto,
    },
    update: {},
  });
}

async function intentarCanalExterno(aviso: AvisoEnCola, canal: CanalWhatsApp, ahora: Date) {
  // Sin teléfono o si la persona no quiere ese tipo por WhatsApp (HU-GAR-18), queda solo la copia interna.
  if (
    !aviso.telefono ||
    !aviso.plantilla ||
    !saleAlWhatsApp(await leerPreferencias(aviso.destinatarioId), aviso.tipo)
  ) {
    await prisma.avisoEnCola.update({ where: { id: aviso.id }, data: { estado: "SIN_CANAL_EXTERNO" } });
    return "sinCanal" as const;
  }
  try {
    await canal.enviar({
      telefono: aviso.telefono,
      plantilla: aviso.plantilla,
      parametros: aviso.parametros,
    });
    await prisma.avisoEnCola.update({
      where: { id: aviso.id },
      // Los parámetros pueden llevar un enlace de entrada: no quedan guardados tras el envío.
      data: { estado: "ENVIADA", canal: canal.nombre, enviadoEn: ahora, ultimoError: null, parametros: [] },
    });
    return "enviados" as const;
  } catch (error) {
    const agotado = aviso.intentos >= MAX_INTENTOS;
    await prisma.avisoEnCola.update({
      where: { id: aviso.id },
      data: {
        estado: agotado ? "FALLIDA" : "PENDIENTE",
        canal: canal.nombre,
        ultimoError: String(error),
        ...(agotado && { parametros: [] }),
      },
    });
    return agotado ? ("fallidos" as const) : ("reintentos" as const);
  }
}

/** Despacha los avisos pendientes. Lo llama el worker en cada ejecución (ADR-006). */
export async function despacharAvisos(
  ahora = new Date(),
  canal: CanalWhatsApp = elegirCanal(),
): Promise<ResumenDespacho> {
  const resumen: ResumenDespacho = { enviados: 0, sinCanal: 0, reintentos: 0, fallidos: 0 };
  for (let lote = await reclamarLote(ahora); lote.length; lote = await reclamarLote(ahora)) {
    for (const aviso of lote) {
      await escribirCopiaInterna(aviso);
      resumen[await intentarCanalExterno(aviso, canal, ahora)]++;
    }
  }
  return resumen;
}
