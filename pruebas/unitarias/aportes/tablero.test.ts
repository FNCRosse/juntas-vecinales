import {
  consolidar,
  cuadra,
  FILTROS_DE_ESTADO,
  filtroDeMorosidad,
  periodosPredefinidos,
  prepararConsulta,
  resolverPeriodo,
} from "@/modulos/aportes/dominio/tablero";

const HOY = "2026-09-27";
// 2026-09-07 es lunes: 0:00 en Lima son las 5:00 en UTC.
const lima = (dia: string, hora = "12:00") => new Date(`${dia}T${hora}:00-05:00`);

describe("@HU-COB-13 CA2 filtros", () => {
  it("@HU-COB-13 CA2 el estado de las casas se dice con las palabras del prototipo", () => {
    expect(FILTROS_DE_ESTADO).toEqual([
      { valor: "TODAS", etiqueta: "Todas las casas" },
      { valor: "AL_DIA", etiqueta: "Al día" },
      { valor: "ATRASO", etiqueta: "Atraso de 1 a 7 semanas" },
      { valor: "CRITICO", etiqueta: "8 semanas o más" },
    ]);
    expect(filtroDeMorosidad("SOLVENTE")).toBe("AL_DIA");
    expect(filtroDeMorosidad("MOROSO_PREVENTIVO")).toBe("ATRASO");
    expect(filtroDeMorosidad("MOROSO_CRITICO")).toBe("CRITICO");
  });

  it("@HU-COB-13 CA2 sin pedir nada, mira el mes en curso hasta hoy y todas las casas", () => {
    expect(prepararConsulta({}, HOY)).toEqual({
      errores: {},
      consulta: { desde: "2026-09-01", hasta: HOY, estado: "TODAS" },
    });
  });

  it("@HU-COB-13 CA2 acepta un rango de fechas y un estado, y rechaza lo que no es", () => {
    expect(
      prepararConsulta({ desde: "2026-07-01", hasta: "2026-08-31", estado: "CRITICO" }, HOY).consulta,
    ).toEqual({
      desde: "2026-07-01",
      hasta: "2026-08-31",
      estado: "CRITICO",
    });
    expect(prepararConsulta({ desde: "01/07/2026" }, HOY).errores.desde).toBe(
      "Escriba la fecha como 2026-07-01.",
    );
    expect(prepararConsulta({ hasta: "2026-02-30" }, HOY).errores.hasta).toBe(
      "Escriba la fecha como 2026-07-01.",
    );
    expect(prepararConsulta({ estado: "MOROSOS" }, HOY).errores.estado).toBe("Elija un estado de la lista.");
    expect(prepararConsulta({ desde: "2026-09-10", hasta: "2026-09-01" }, HOY).errores.hasta).toBe(
      "La fecha final no puede ser antes de la inicial.",
    );
    expect(prepararConsulta({ desde: "2024-01-01", hasta: "2026-09-01" }, HOY).errores.hasta).toBe(
      "Elija un rango de hasta un año.",
    );
  });

  it("@HU-COB-13 CA2 ofrece los últimos tres meses y el rango de los tres juntos", () => {
    const periodos = periodosPredefinidos(HOY);
    expect(periodos.map((p) => [p.valor, p.etiqueta, p.desde, p.hasta])).toEqual([
      ["2026-09", "Setiembre de 2026", "2026-09-01", "2026-09-30"],
      ["2026-08", "Agosto de 2026", "2026-08-01", "2026-08-31"],
      ["2026-07", "Julio de 2026", "2026-07-01", "2026-07-31"],
      ["tres-meses", "Del 1 de julio al 27 de setiembre de 2026", "2026-07-01", HOY],
    ]);
    expect(resolverPeriodo("2026-08", HOY)).toMatchObject({ desde: "2026-08-01", hasta: "2026-08-31" });
    expect(resolverPeriodo("raro", HOY)).toMatchObject({ valor: "2026-09" });
  });

  it("@HU-COB-13 CA2 el cambio de año no rompe los meses", () => {
    expect(periodosPredefinidos("2027-01-10").map((p) => p.valor)).toEqual([
      "2027-01",
      "2026-12",
      "2026-11",
      "tres-meses",
    ]);
  });
});

describe("@HU-COB-13 CA1 consolidar", () => {
  const recibos = [
    { monto: 500, fecha: lima("2026-09-02"), digital: true },
    { monto: 250, fecha: lima("2026-09-02"), digital: false },
    { monto: 750, fecha: lima("2026-09-07", "00:00"), digital: false },
    { monto: 1000, fecha: lima("2026-09-13", "23:59"), digital: true },
    { monto: 250, fecha: lima("2026-09-21"), digital: true },
  ];

  it("@HU-COB-13 CA1 suma digitales y en efectivo, y cuenta los recibos", () => {
    const t = consolidar(recibos, "2026-09-01", "2026-09-27");
    expect(t.total).toBe(2750);
    expect(t.cantidad).toBe(5);
    expect(t.digital).toEqual({ monto: 1750, cantidad: 3 });
    expect(t.efectivo).toEqual({ monto: 1000, cantidad: 2 });
  });

  it("@HU-COB-13 CA1 agrupa por semana de lunes a domingo en hora de Lima, también la de medianoche", () => {
    const t = consolidar(recibos, "2026-09-01", "2026-09-27");
    expect(t.semanas.map((s) => [s.inicio, s.etiqueta, s.digital, s.efectivo, s.total])).toEqual([
      ["2026-08-31", "Semana del 31 de agosto al 6 de setiembre", 500, 250, 750],
      ["2026-09-07", "Semana del 7 al 13 de setiembre", 1000, 750, 1750],
      ["2026-09-14", "Semana del 14 al 20 de setiembre", 0, 0, 0],
      ["2026-09-21", "Semana del 21 al 27 de setiembre", 250, 0, 250],
    ]);
  });

  it("@HU-COB-13 CA3 el total de las semanas es el total de los recibos, al céntimo", () => {
    const t = consolidar(recibos, "2026-09-01", "2026-09-27");
    expect(t.semanas.reduce((suma, s) => suma + s.total, 0)).toBe(t.total);
    expect(cuadra(t.total, 2750, 2750)).toBe(true);
    expect(cuadra(t.total, 2750, 2749)).toBe(false);
  });

  it("@HU-COB-13 CA1 sin recibos todo es cero y sigue habiendo semanas", () => {
    const t = consolidar([], "2026-09-01", "2026-09-27");
    expect(t).toMatchObject({ total: 0, cantidad: 0, digital: { monto: 0, cantidad: 0 } });
    expect(t.semanas).toHaveLength(4);
  });
});
