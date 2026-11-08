// @HU-QUE-08 @HU-ACC-07
import { manzanasDelBarrio } from "@/modulos/identidad/aplicacion/barrio";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  PERIODOS_DEL_MAPA,
  type PeriodoDelMapa,
  descripcionTextualAlternativa,
  ESTADOS_EN_EL_MAPA,
  nombreDeZona,
  resumirPorZona,
  TIPO_CORTO,
  totalesDelBarrio,
} from "@/modulos/incidencias/dominio/mapa";
import { CATEGORIAS, type Estado } from "@/modulos/incidencias/dominio/queja";
import { quejasParaElMapa } from "@/modulos/incidencias/infraestructura/repositorioQuejas";

const ROLES = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ESTADO_EN_EL_MAPA = {
  EN_REVISION: "En revisión",
  RESUELTO: "Resuelto",
  DERIVADO_ENTIDAD_EXTERNA: "Derivado a otra entidad",
} as const;

export { CATEGORIAS, PERIODOS_DEL_MAPA, TIPO_CORTO };
export type { PeriodoDelMapa };

/**
 * Los incidentes del barrio en el último mes (HU-QUE-08): por manzana y tipo, con su mapa de calor (CA1),
 * generalizados a la manzana para todos (CA2) y leídos en cada consulta, así que cambian apenas la
 * directiva valida o cierra un reporte (CA3). Trae su descripción en texto, la lista y la tabla (HU-ACC-07).
 */
export async function mapaDeIncidentes(
  sesion: SesionDto,
  ahora = new Date(),
  periodo: PeriodoDelMapa = "mes",
) {
  exigirRol(sesion, ...ROLES);
  const { dias, frase, etiqueta } = PERIODOS_DEL_MAPA[periodo];
  const desde = new Date(ahora.getTime() - dias * 86_400_000);
  const [filas, manzanas] = await Promise.all([
    quejasParaElMapa([...ESTADOS_EN_EL_MAPA], desde),
    manzanasDelBarrio(),
  ]);
  const zonas = resumirPorZona(filas, manzanas);
  return {
    zonas,
    totales: totalesDelBarrio(filas),
    descripcion: descripcionTextualAlternativa(zonas, frase),
    periodo: { clave: periodo, etiqueta, frase },
    recientes: filas.slice(0, 20).map((f) => ({
      categoria: f.categoria,
      tipo: CATEGORIAS[f.categoria],
      zona: nombreDeZona(f.manzana),
      fecha: f.fechaRegistro.toISOString(),
      estado: ESTADO_EN_EL_MAPA[f.estado as keyof typeof ESTADO_EN_EL_MAPA],
      clave: f.estado as Estado,
    })),
  };
}
export type MapaDto = Awaited<ReturnType<typeof mapaDeIncidentes>>;
