import {
  descripcionTextualAlternativa,
  type FilaMapa,
  resumirPorZona,
  totalesDelBarrio,
} from "@/modulos/incidencias/dominio/mapa";

const F = new Date("2026-09-24T15:00:00Z");
const fila = (
  manzana: string | null,
  categoria: FilaMapa["categoria"],
  estado: FilaMapa["estado"] = "EN_REVISION",
) => ({
  manzana,
  categoria,
  estado,
  fechaRegistro: F,
});
const FILAS: FilaMapa[] = [
  fila("A", "RUIDOS", "RESUELTO"),
  fila("A", "RUIDOS"),
  fila("C", "RUIDOS"),
  fila("C", "RUIDOS"),
  fila("C", "RUIDOS", "RESUELTO"),
  fila("C", "RUIDOS"),
  fila("C", "SEGURIDAD", "DERIVADO_ENTIDAD_EXTERNA"),
  fila(null, "COCHERAS", "RESUELTO"),
];

describe("@HU-QUE-08 Mapa de incidentes", () => {
  it("@HU-QUE-08 CA1 CA2 agrupa por manzana y tipo, con todas las manzanas del padrón y la intensidad en palabras", () => {
    const zonas = resumirPorZona(FILAS, ["A", "B", "C"]);
    expect(zonas.map((z) => [z.zona, z.total, z.intensidad])).toEqual([
      ["Mz. A", 2, "varios"],
      ["Mz. B", 0, "ninguno"],
      ["Mz. C", 5, "muchos"],
      ["Otros lugares del barrio", 1, "pocos"],
    ]);
    expect(zonas[2].porTipo).toMatchObject({ RUIDOS: 4, SEGURIDAD: 1, BASURA: 0 });
    expect(
      resumirPorZona(
        [
          fila("A", "BASURA"),
          fila("B", "BASURA"),
          fila("B", "BASURA"),
          fila("C", "OTROS"),
          fila("C", "OTROS"),
          fila("C", "OTROS"),
        ],
        ["A", "B", "C"],
      ).map((z) => z.intensidad),
    ).toEqual(["pocos", "varios", "muchos"]);
  });

  it("@HU-QUE-08 los totales del barrio por tipo y por estado", () => {
    expect(totalesDelBarrio(FILAS)).toEqual({
      porTipo: { RUIDOS: 6, BASURA: 0, COCHERAS: 1, SEGURIDAD: 1, OTROS: 0 },
      total: 8,
      enRevision: 4,
      resueltos: 3,
      derivados: 1,
    });
  });
});

describe("@HU-ACC-07 Alternativa textual del mapa", () => {
  it("@HU-ACC-07 CA2 describe cada zona con reportes y resume lo que más se repite", () => {
    expect(descripcionTextualAlternativa(resumirPorZona(FILAS, ["A", "B", "C"]))).toEqual({
      etiqueta:
        "Mapa del barrio por manzanas. Mz. A: 2 de ruido. Mz. C: 4 de ruido y 1 de seguridad. Otros lugares del barrio: 1 de cocheras.",
      resumen: "8 reportes en el último mes. Lo que más se repite: ruidos molestos en la Mz. C (4).",
    });
    expect(descripcionTextualAlternativa(resumirPorZona([], ["A"]))).toEqual({
      etiqueta: "Mapa del barrio por manzanas, sin reportes en el último mes.",
      resumen: "No hay reportes validados en el último mes.",
    });
  });
});
