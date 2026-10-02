// @HU-GAR-20 @HU-GAR-18
import {
  contarNoLeidas,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "@/compartido/notificaciones/centro";
import {
  guardarPreferencias,
  leerPreferencias,
  type Preferencias,
} from "@/compartido/notificaciones/preferencias";
import type { SesionDto } from "./sesion";

export type { Preferencias };

/** Filtros del centro (prototipo VEC-ACC-11) y el módulo de origen de cada tipo (CA1). */
export const FILTROS = {
  todos: { etiqueta: "Todos", tipos: undefined },
  pagos: { etiqueta: "Pagos", tipos: ["PAGOS"] },
  asambleas: { etiqueta: "Asambleas", tipos: ["ASAMBLEAS"] },
  reportes: { etiqueta: "Reportes", tipos: ["REPORTES"] },
  garita: { etiqueta: "Garita", tipos: ["GARITA", "SEGURIDAD"] },
} as const;
export type Filtro = keyof typeof FILTROS;

export const ORIGEN = {
  CUENTA: "Su cuenta",
  SEGURIDAD: "Seguridad",
  PAGOS: "Pagos",
  ASAMBLEAS: "Asambleas",
  REPORTES: "Reportes",
  GARITA: "Garita",
  NOTICIAS: "Noticias",
} as const;

/** Avisos de quien pregunta, los más nuevos arriba (HU-GAR-20 CA1), con el filtro por tipo (CA2). */
export async function verAvisos(sesion: SesionDto, filtro: Filtro = "todos") {
  const tipos = FILTROS[filtro]?.tipos;
  const [avisos, noLeidos] = await Promise.all([
    listarNotificaciones(sesion.usuarioId, tipos ? [...tipos] : undefined),
    contarNoLeidas(sesion.usuarioId),
  ]);
  return {
    noLeidos,
    avisos: avisos.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      origen: ORIGEN[a.tipo],
      titulo: a.titulo,
      texto: a.texto,
      fecha: a.creadaEn.toISOString(),
      nuevo: a.leidaEn === null,
    })),
  };
}

/** El contador que se ve en Más y en el inicio: se lee en cada carga (CA3). */
export const avisosSinLeer = (sesion: SesionDto) => contarNoLeidas(sesion.usuarioId);

export const marcarAvisoLeido = (sesion: SesionDto, id: string) => marcarLeida(sesion.usuarioId, id);
export const marcarTodosLeidos = (sesion: SesionDto) => marcarTodasLeidas(sesion.usuarioId);

/** Qué avisos recibe por WhatsApp (HU-GAR-18 CA1); se aplica desde el próximo envío (CA2). */
export const misPreferencias = (sesion: SesionDto) => leerPreferencias(sesion.usuarioId);
export const cambiarPreferencias = (sesion: SesionDto, cambios: Partial<Preferencias>) =>
  guardarPreferencias(sesion.usuarioId, cambios);
