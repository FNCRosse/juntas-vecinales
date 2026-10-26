import {
  CONCEPTOS_DE_GASTO,
  CONCEPTOS_DE_INGRESO,
  garantizarNoIdentificacion,
  mesValido,
  prepararMovimiento,
  rangoDelMes,
  resumirMes,
} from "@/modulos/transparencia/dominio/caja";

const HOY = "2026-09-27";
const GASTO = {
  tipo: "GASTO",
  monto: 3500,
  concepto: "MANTENIMIENTO",
  detalle: "Foco LED para la garita",
  fecha: HOY,
  archivoId: "archivo-1",
};

describe("@HU-COB-14 Registrar un movimiento de la caja", () => {
  it("@HU-COB-14 los conceptos son los del prototipo", () => {
    expect(Object.values(CONCEPTOS_DE_GASTO)).toEqual([
      "Pago a vigilantes",
      "Luz o agua de la garita",
      "Mantenimiento o reparación",
      "Útiles y materiales",
      "Otro gasto",
    ]);
    expect(Object.values(CONCEPTOS_DE_INGRESO)).toEqual(["Donación", "Otro ingreso"]);
  });

  it("@HU-COB-14 un gasto completo se acepta y el detalle sin texto queda vacío", () => {
    expect(prepararMovimiento(GASTO, HOY)).toEqual({ errores: {}, movimiento: { ...GASTO, tipo: "GASTO" } });
    expect(prepararMovimiento({ ...GASTO, detalle: "  " }, HOY).movimiento?.detalle).toBeNull();
  });

  it("@HU-COB-14 un ingreso no necesita comprobante", () => {
    const r = prepararMovimiento({ ...GASTO, tipo: "INGRESO", concepto: "DONACION", archivoId: "" }, HOY);
    expect(r.errores).toEqual({});
    expect(r.movimiento?.archivoId).toBeNull();
  });

  it("@HU-COB-14 un gasto sin foto del comprobante no se acepta", () => {
    expect(prepararMovimiento({ ...GASTO, archivoId: "" }, HOY).errores.archivoId).toBe(
      "Adjunte la foto del comprobante del gasto.",
    );
  });

  it("@HU-COB-14 pide el monto, el concepto de su tipo y una fecha real que no sea futura", () => {
    expect(prepararMovimiento({ ...GASTO, monto: null }, HOY).errores.monto).toBe("Escriba cuánto fue.");
    expect(prepararMovimiento({ ...GASTO, monto: 0 }, HOY).errores.monto).toBe("Escriba cuánto fue.");
    expect(prepararMovimiento({ ...GASTO, monto: 999_999_999 }, HOY).errores.monto).toBe(
      "Escriba un monto en soles, por ejemplo 150.50.",
    );
    expect(prepararMovimiento({ ...GASTO, concepto: "DONACION" }, HOY).errores.concepto).toBe(
      "Elija en qué se gastó.",
    );
    expect(
      prepararMovimiento({ ...GASTO, tipo: "INGRESO", concepto: "VIGILANTES", archivoId: "" }, HOY).errores
        .concepto,
    ).toBe("Elija de dónde viene.");
    expect(prepararMovimiento({ ...GASTO, tipo: "OTRO" }, HOY).errores.tipo).toBe(
      "Elija si es un gasto o un ingreso.",
    );
    expect(prepararMovimiento({ ...GASTO, fecha: "2026-09-28" }, HOY).errores.fecha).toBe(
      "La fecha no puede ser futura.",
    );
    expect(prepararMovimiento({ ...GASTO, fecha: "2026-02-30" }, HOY).errores.fecha).toBe(
      "Elija la fecha del movimiento.",
    );
    expect(prepararMovimiento({ ...GASTO, detalle: "a".repeat(121) }, HOY).errores.detalle).toContain(
      "hasta 120 letras",
    );
  });
});

describe("@HU-COB-14 La rendición del mes", () => {
  it("@HU-COB-14 el mes y su rango", () => {
    expect(mesValido("2026-09")).toBe(true);
    expect(mesValido("2026-13")).toBe(false);
    expect(mesValido("setiembre")).toBe(false);
    expect(rangoDelMes("2026-09")).toEqual({ desde: "2026-09-01", hasta: "2026-09-30" });
    expect(rangoDelMes("2028-02")).toEqual({ desde: "2028-02-01", hasta: "2028-02-29" });
  });

  it("@HU-COB-14 suma ingresos (cuotas y otros), gastos por concepto, saldo y comprobantes", () => {
    const r = resumirMes({
      cuotas: 184000,
      movimientos: [
        { tipo: "GASTO", concepto: "VIGILANTES", monto: 140000, archivoId: "a" },
        { tipo: "GASTO", concepto: "MANTENIMIENTO", monto: 15000, archivoId: "b" },
        { tipo: "GASTO", concepto: "MANTENIMIENTO", monto: 5000, archivoId: "c" },
        { tipo: "INGRESO", concepto: "DONACION", monto: 10000, archivoId: null },
      ],
    });
    expect(r).toEqual({
      ingresosPorCuotas: 184000,
      ingresosOtros: 10000,
      ingresos: 194000,
      gastos: 160000,
      saldo: 34000,
      comprobantes: 3,
      gastosPorConcepto: [
        { clave: "VIGILANTES", concepto: "Pago a vigilantes", monto: 140000 },
        { clave: "MANTENIMIENTO", concepto: "Mantenimiento o reparación", monto: 20000 },
      ],
    });
  });

  it("@HU-COB-14 sin movimientos todo es cero y el saldo puede ser negativo", () => {
    expect(resumirMes({ cuotas: 0, movimientos: [] })).toMatchObject({
      ingresos: 0,
      gastos: 0,
      saldo: 0,
      gastosPorConcepto: [],
    });
    expect(
      resumirMes({
        cuotas: 0,
        movimientos: [{ tipo: "GASTO", concepto: "UTILES", monto: 500, archivoId: "a" }],
      }).saldo,
    ).toBe(-500);
  });
});

describe("@HU-COB-14 CA2 El balance agregado no identifica a nadie", () => {
  it("@HU-COB-14 CA2 acepta totales y rechaza cualquier dato de una casa o una persona, a cualquier profundidad", () => {
    expect(() =>
      garantizarNoIdentificacion({
        seJunto: 100,
        faltaCobrar: { monto: 10, cuotas: 2 },
        semanas: [{ etiqueta: "Semana", total: 5 }],
      }),
    ).not.toThrow();
    expect(() => garantizarNoIdentificacion({ casas: [] })).toThrow("no puede identificar");
    expect(() => garantizarNoIdentificacion({ semanas: [{ vivienda: "Mz. A" }] })).toThrow(
      "no puede identificar",
    );
    expect(() => garantizarNoIdentificacion({ deuda: { dni: "1" } })).toThrow("no puede identificar");
    expect(() => garantizarNoIdentificacion({ x: [{ nombre: "Ana" }] })).toThrow("no puede identificar");
  });
});
