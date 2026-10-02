import { prisma } from "../bd/cliente";
import type { TipoAviso } from "../bd/generado/client";

// Preferencias de aviso por persona (HU-GAR-18): qué tipos salen por WhatsApp. La copia interna en el
// centro de notificaciones existe siempre (ADR-006), y los avisos de su cuenta y de seguridad salen
// siempre (CA3).

export type Preferencias = {
  whatsapp: boolean;
  pagos: boolean;
  asambleas: boolean;
  reportes: boolean;
  garita: boolean;
  noticias: boolean;
};

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  whatsapp: true,
  pagos: true,
  asambleas: true,
  reportes: true,
  garita: true,
  noticias: false,
};

const PREFERENCIA_DEL_TIPO: Partial<Record<TipoAviso, keyof Preferencias>> = {
  PAGOS: "pagos",
  ASAMBLEAS: "asambleas",
  REPORTES: "reportes",
  GARITA: "garita",
  NOTICIAS: "noticias",
};

/** Si un aviso de ese tipo sale por WhatsApp con estas preferencias. */
export function saleAlWhatsApp(preferencias: Preferencias, tipo: TipoAviso) {
  const campo = PREFERENCIA_DEL_TIPO[tipo];
  if (!campo) return true;
  return preferencias.whatsapp && preferencias[campo];
}

export async function leerPreferencias(usuarioId: string): Promise<Preferencias> {
  const fila = await prisma.preferenciaAviso.findUnique({ where: { usuarioId } });
  if (!fila) return { ...PREFERENCIAS_POR_DEFECTO };
  const { whatsapp, pagos, asambleas, reportes, garita, noticias } = fila;
  return { whatsapp, pagos, asambleas, reportes, garita, noticias };
}

/** Guarda un cambio; vale desde el próximo envío (CA2). */
export async function guardarPreferencias(usuarioId: string, cambios: Partial<Preferencias>) {
  await prisma.preferenciaAviso.upsert({
    where: { usuarioId },
    create: { usuarioId, ...PREFERENCIAS_POR_DEFECTO, ...cambios },
    update: cambios,
  });
  return leerPreferencias(usuarioId);
}
