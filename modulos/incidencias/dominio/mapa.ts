// @HU-QUE-08 @HU-ACC-07
import { CATEGORIAS, type Categoria, type Estado } from "./queja";

// MapaIncidentes: el barrio por manzanas con los reportes que la directiva ya validó (admitidos, resueltos
// o derivados), nunca los recibidos ni los rechazados. Todo se generaliza a la manzana: ningún reporte
// muestra la casa ni las coordenadas de quien lo envió (HU-QUE-08 CA2, HU-GAR-15), y cada vista tiene su
// equivalente en texto (HU-ACC-07 CA2).

export const ESTADOS_EN_EL_MAPA = ["EN_REVISION", "RESUELTO", "DERIVADO_ENTIDAD_EXTERNA"] as const;
export const DIAS_DEL_MAPA = 30;
export const OTROS_LUGARES = "Otros lugares del barrio";

/** Cómo se nombra cada tipo en el mapa y la tabla, en corto. */
export const TIPO_CORTO: Record<Categoria, string> = {
  RUIDOS: "Ruido",
  BASURA: "Basura",
  COCHERAS: "Cocheras",
  SEGURIDAD: "Seguridad",
  OTROS: "Otros",
};

const TIPOS = Object.keys(CATEGORIAS) as Categoria[];

export type FilaMapa = { manzana: string | null; categoria: Categoria; estado: Estado; fechaRegistro: Date };
export type Intensidad = "ninguno" | "pocos" | "varios" | "muchos";

export const nombreDeZona = (manzana: string | null) => (manzana ? `Mz. ${manzana}` : OTROS_LUGARES);

/**
 * El mapa de calor por zona: cuántos reportes de cada tipo hay en cada manzana (las del padrón, aunque no
 * tengan ninguno) y qué tan intensa es la zona respecto de la que más tiene, dicho en palabras.
 */
export function resumirPorZona(filas: FilaMapa[], manzanas: string[]) {
  const zonas = new Map<string, Record<Categoria, number>>();
  const vacia = () => Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<Categoria, number>;
  for (const m of manzanas) zonas.set(nombreDeZona(m), vacia());
  for (const f of filas) {
    const zona = nombreDeZona(f.manzana);
    if (!zonas.has(zona)) zonas.set(zona, vacia());
    zonas.get(zona)![f.categoria] += 1;
  }
  const totales = [...zonas.values()].map((porTipo) => TIPOS.reduce((s, t) => s + porTipo[t], 0));
  const maximo = Math.max(0, ...totales);
  const intensidad = (total: number): Intensidad =>
    total === 0 ? "ninguno" : total * 3 <= maximo ? "pocos" : total * 3 <= maximo * 2 ? "varios" : "muchos";
  return [...zonas.entries()].map(([zona, porTipo], i) => ({
    zona,
    porTipo,
    total: totales[i],
    intensidad: intensidad(totales[i]),
  }));
}
export type Zona = ReturnType<typeof resumirPorZona>[number];

/** Los totales del barrio por tipo y por estado, para la fila final de la tabla y el resumen. */
export function totalesDelBarrio(filas: FilaMapa[]) {
  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, filas.filter((f) => f.categoria === t).length]));
  return {
    porTipo: porTipo as Record<Categoria, number>,
    total: filas.length,
    enRevision: filas.filter((f) => f.estado === "EN_REVISION").length,
    resueltos: filas.filter((f) => f.estado === "RESUELTO").length,
    derivados: filas.filter((f) => f.estado === "DERIVADO_ENTIDAD_EXTERNA").length,
  };
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * La descripción textual alternativa del mapa (HU-ACC-07 CA2): qué hay en cada zona con reportes, en el
 * orden del mapa, y la frase que resume lo principal.
 */
export function descripcionTextualAlternativa(zonas: Zona[]) {
  const conReportes = zonas.filter((z) => z.total > 0);
  const total = conReportes.reduce((s, z) => s + z.total, 0);
  if (!total) {
    return {
      etiqueta: "Mapa del barrio por manzanas, sin reportes en el último mes.",
      resumen: "No hay reportes validados en el último mes.",
    };
  }
  const partes = conReportes.map(
    (z) =>
      `${z.zona}: ${TIPOS.filter((t) => z.porTipo[t] > 0)
        .map((t) => `${z.porTipo[t]} de ${TIPO_CORTO[t].toLowerCase()}`)
        .join(" y ")}`,
  );
  let mayor = { zona: conReportes[0].zona, tipo: TIPOS[0], cantidad: 0 };
  for (const z of conReportes) {
    for (const t of TIPOS)
      if (z.porTipo[t] > mayor.cantidad) mayor = { zona: z.zona, tipo: t, cantidad: z.porTipo[t] };
  }
  return {
    etiqueta: `Mapa del barrio por manzanas. ${partes.join(". ")}.`,
    resumen: `${plural(total, "reporte", "reportes")} en el último mes. Lo que más se repite: ${CATEGORIAS[mayor.tipo].toLowerCase()} en ${mayor.zona === OTROS_LUGARES ? "otros lugares del barrio" : `la ${mayor.zona}`} (${mayor.cantidad}).`,
  };
}
