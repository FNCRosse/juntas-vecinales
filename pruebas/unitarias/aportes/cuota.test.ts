import type { Concepto } from "@/modulos/aportes/dominio/tarifa";
import {
  calcularCuota,
  etiquetaDeSemana,
  fechaLimiteDe,
  inicioDeSemana,
  lunesDe,
  MAXIMO_RECUPERACION,
  periodosPorEmitir,
} from "@/modulos/aportes/dominio/cuota";

const CONCEPTOS: Concepto[] = [
  { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250 },
  { clave: "inquilino", nombre: "Inquilino", unidad: "POR_INQUILINO", monto: 250 },
  { clave: "auto", nombre: "Auto o camioneta", unidad: "POR_VEHICULO", monto: 200 },
  { clave: "bicicleta", nombre: "Bicicleta", unidad: "POR_VEHICULO", monto: 30 },
];

describe("@HU-COB-01 ciclo semanal en America/Lima", () => {
  it("@HU-COB-01 la semana va de lunes a domingo y su cuota se genera el lunes", () => {
    // Domingo 27 de setiembre de 2026, 9:00 p. m. en Lima (ya lunes en UTC).
    expect(lunesDe(new Date("2026-09-28T02:00:00Z"))).toBe("2026-09-21");
    // Lunes 28, 12:30 a. m. en Lima.
    expect(lunesDe(new Date("2026-09-28T05:30:00Z"))).toBe("2026-09-28");
    // Miércoles 30.
    expect(lunesDe(new Date("2026-09-30T15:00:00Z"))).toBe("2026-09-28");
  });

  it("@HU-COB-01 la semana empieza a las 0:00 del lunes y vence el domingo a las 11:59 p. m. de Lima", () => {
    expect(inicioDeSemana("2026-09-28").toISOString()).toBe("2026-09-28T05:00:00.000Z");
    expect(fechaLimiteDe("2026-09-28").toISOString()).toBe("2026-10-05T04:59:59.000Z");
  });

  it("@HU-COB-01 la semana se dice con sus días, también cuando cruza de mes", () => {
    expect(etiquetaDeSemana("2026-09-07")).toBe("Semana del 7 al 13 de setiembre");
    expect(etiquetaDeSemana("2026-09-28")).toBe("Semana del 28 de setiembre al 4 de octubre");
  });
});

describe("@HU-COB-01 qué semanas faltan por emitir", () => {
  it("@HU-COB-01 sin ninguna cuota anterior, solo la semana actual", () => {
    expect(periodosPorEmitir(null, "2026-09-28")).toEqual(["2026-09-28"]);
  });

  it("@HU-COB-01 con la semana actual ya emitida no falta ninguna (idempotente)", () => {
    expect(periodosPorEmitir("2026-09-28", "2026-09-28")).toEqual([]);
  });

  it("@HU-COB-01 si el worker no corrió una semana, la recupera sin saltarse ninguna", () => {
    expect(periodosPorEmitir("2026-09-14", "2026-09-28")).toEqual(["2026-09-21", "2026-09-28"]);
  });

  it("@HU-COB-01 recupera como máximo las últimas semanas, las más recientes", () => {
    const faltan = periodosPorEmitir("2025-01-06", "2026-09-28");
    expect(faltan).toHaveLength(MAXIMO_RECUPERACION);
    expect(faltan.at(-1)).toBe("2026-09-28");
    expect(faltan[0]).toBe("2026-08-10");
  });
});

describe("@HU-COB-01 CA1 calcular la cuota de una casa", () => {
  it("@HU-COB-01 CA1 suma monto por cantidad de cada concepto con lo que hay en el predio", () => {
    const { lineas, total } = calcularCuota(CONCEPTOS, { casa: 1, inquilino: 1, auto: 2 });
    expect(total).toBe(250 + 250 + 400);
    expect(lineas).toEqual([
      expect.objectContaining({ clave: "casa", cantidad: 1, montoUnitario: 250, subtotal: 250 }),
      expect.objectContaining({ clave: "inquilino", cantidad: 1, subtotal: 250 }),
      expect.objectContaining({ clave: "auto", nombre: "Auto o camioneta", cantidad: 2, subtotal: 400 }),
    ]);
  });

  it("@HU-COB-01 CA1 un concepto sin unidades en el predio no aparece, y un concepto nuevo todavía no se cobra", () => {
    const { lineas, total } = calcularCuota(CONCEPTOS, { casa: 1 });
    expect(lineas.map((l) => l.clave)).toEqual(["casa"]);
    expect(total).toBe(250);
    expect(calcularCuota(CONCEPTOS, {})).toEqual({ lineas: [], total: 0 });
  });
});
