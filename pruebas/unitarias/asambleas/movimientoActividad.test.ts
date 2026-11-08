import { prepararMovimiento, totalesDeActividad } from "@/modulos/asambleas/dominio/movimientoActividad";

describe("@HU-ASA-10 lo que se anota de una actividad antes de su balance", () => {
  it("un gasto pide concepto, monto y la foto de su comprobante", () => {
    const { errores } = prepararMovimiento({ tipo: "GASTO", concepto: " ", monto: null, archivoId: "" });
    expect(Object.keys(errores).sort()).toEqual(["archivoId", "concepto", "monto"]);
  });

  it("lo cobrado en la puerta no lleva comprobante y limpia los espacios", () => {
    const { errores, movimiento } = prepararMovimiento({
      tipo: "INGRESO_EN_PUERTA",
      concepto: "  38   cartillas ",
      monto: 38000,
      archivoId: "algo",
    });
    expect(errores).toEqual({});
    expect(movimiento).toEqual({
      tipo: "INGRESO_EN_PUERTA",
      concepto: "38 cartillas",
      monto: 38000,
      archivoId: null,
    });
  });

  it("rechaza un tipo desconocido y un monto que no es positivo", () => {
    const { errores } = prepararMovimiento({ tipo: "OTRO", concepto: "Algo", monto: 0 });
    expect(errores.tipo).toBeDefined();
    expect(errores.monto).toBe("Escriba cuánto fue.");
  });

  it("suma lo pagado por adelantado, lo de la puerta y los gastos", () => {
    expect(
      totalesDeActividad(
        [1000, 2000],
        [
          { tipo: "INGRESO_EN_PUERTA", monto: 38000 },
          { tipo: "GASTO", monto: 18500 },
          { tipo: "GASTO", monto: 4200 },
        ],
      ),
    ).toEqual({
      ingresosVirtuales: 3000,
      ingresosEnPuerta: 38000,
      ingresos: 41000,
      egresos: 22700,
      utilidadNeta: 18300,
    });
  });
});
