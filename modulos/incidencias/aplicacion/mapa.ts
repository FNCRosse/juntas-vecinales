// @HU-QUE-08 @HU-ACC-07
import { manzanasDelBarrio } from "@/modulos/identidad/aplicacion/barrio";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  DIAS_DEL_MAPA,
  descripcionTextualAlternativa,
  ESTADOS_EN_EL_MAPA,
  nombreDeZona,
  resumirPorZona,
  TIPO_CORTO,
  totalesDelBarrio,
} from "@/modulos/incidencias/dominio/mapa";
import { CATEGORIAS } from "@/modulos/incidencias/dominio/queja";
import { quejasParaElMapa } from "@/modulos/incidencias/infraestructura/repositorioQuejas";

const ROLES = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ESTADO_EN_EL_MAPA = {
  EN_REVISION: "En revisión",
  RESUELTO: "Resuelto",
  DERIVADO_ENTIDAD_EXTERNA: "Derivado a otra entidad",
} as const;

export { CATEGORIAS, TIPO_CORTO };

/**
 * Los incidentes del barrio en el último mes (HU-QUE-08): por manzana y tipo, con su mapa de calor (CA1),
 * generalizados a la manzana para todos (CA2) y leídos en cada consulta, así que cambian apenas la
 * directiva valida o cierra un reporte (CA3). Trae su descripción en texto, la lista y la tabla (HU-ACC-07).
 */
export async function mapaDeIncidentes(sesion: SesionDto, ahora = new Date()) {
  exigirRol(sesion, ...ROLES);
  const desde = new Date(ahora.getTime() - DIAS_DEL_MAPA * 86_400_000);
  const [filas, manzanas] = await Promise.all([
    quejasParaElMapa([...ESTADOS_EN_EL_MAPA], desde),
    manzanasDelBarrio(),
  ]);
  const zonas = resumirPorZona(filas, manzanas);
  return {
    zonas,
    totales: totalesDelBarrio(filas),
    descripcion: descripcionTextualAlternativa(zonas),
    recientes: filas.slice(0, 20).map((f) => ({
      categoria: f.categoria,
      tipo: CATEGORIAS[f.categoria],
      zona: nombreDeZona(f.manzana),
      fecha: f.fechaRegistro.toISOString(),
      estado: ESTADO_EN_EL_MAPA[f.estado as keyof typeof ESTADO_EN_EL_MAPA],
    })),
  };
}
export type MapaDto = Awaited<ReturnType<typeof mapaDeIncidentes>>;
