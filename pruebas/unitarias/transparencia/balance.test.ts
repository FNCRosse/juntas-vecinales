import { calcularTotales, prepararBalance } from "@/modulos/transparencia/dominio/balance";

const T0 = new Date("2026-10-05T15:00:00Z");
const ARCHIVO = "6f1c2a3b-0000-4000-8000-000000000001";
const datos = {
  titulo: "Pollada pro fondos de setiembre",
  fechaActividad: "2026-09-27",
  ingresosVirtuales: 120000,
  ingresosEnPuerta: 80000,
  egresos: [
    { concepto: " Pollos y papas ", monto: 90000, archivoId: ARCHIVO },
    { concepto: "Alquiler de sillas", monto: 20000, archivoId: ARCHIVO },
  ],
};

describe("@HU-ASA-10 Balance de una actividad pro fondos", () => {
  it("@HU-ASA-10 CA1 desglosa ingresos virtuales y en puerta y limpia los conceptos de los egresos", () => {
    const { errores, balance } = prepararBalance(datos, T0);
    expect(errores).toEqual({});
    expect(balance).toMatchObject({
      titulo: "Pollada pro fondos de setiembre",
      ingresosVirtuales: 120000,
      ingresosEnPuerta: 80000,
      egresos: [
        { concepto: "Pollos y papas", monto: 90000 },
        { concepto: "Alquiler de sillas", monto: 20000 },
      ],
    });
    expect(balance.fechaActividad.toISOString()).toBe("2026-09-27T17:00:00.000Z");
  });

  it("@HU-ASA-10 CA2 la utilidad neta es ingresos virtuales + en puerta − egresos, en céntimos, y puede ser negativa", () => {
    expect(calcularTotales(prepararBalance(datos, T0).balance)).toEqual({
      ingresos: 200000,
      egresos: 110000,
      utilidadNeta: 90000,
    });
    expect(
      calcularTotales({ ingresosVirtuales: 0, ingresosEnPuerta: 5000, egresos: [{ monto: 7550 }] }),
    ).toEqual({ ingresos: 5000, egresos: 7550, utilidadNeta: -2550 });
  });

  it("@HU-ASA-10 CA1 cada gasto lleva su comprobante y su monto, y los errores dicen cuál gasto es", () => {
    const { errores } = prepararBalance(
      {
        ...datos,
        egresos: [
          { concepto: "", monto: 0, archivoId: "" },
          { concepto: "Sonido", monto: 5000, archivoId: ARCHIVO },
        ],
      },
      T0,
    );
    expect(errores).toEqual({
      "egresos.0.concepto": "Escriba en qué se gastó.",
      "egresos.0.monto": "Escriba cuánto se gastó.",
      "egresos.0.archivoId": "Adjunte la foto del comprobante de este gasto.",
    });
  });

  it("@HU-ASA-10 CA1 exige título, fecha pasada y al menos un movimiento; los montos son enteros no negativos", () => {
    expect(
      prepararBalance(
        { titulo: " ", fechaActividad: "", ingresosVirtuales: 0, ingresosEnPuerta: 0, egresos: [] },
        T0,
      ).errores,
    ).toEqual({
      titulo: "Escriba el nombre de la actividad.",
      fechaActividad: "Elija la fecha de la actividad.",
      movimientos: "Registre al menos un ingreso o un gasto.",
    });
    expect(prepararBalance({ ...datos, fechaActividad: "2026-10-06" }, T0).errores.fechaActividad).toBe(
      "La fecha de la actividad no puede ser futura.",
    );
    expect(prepararBalance({ ...datos, ingresosVirtuales: -1 }, T0).errores.ingresosVirtuales).toBe(
      "Escriba un monto en soles, por ejemplo 150.50.",
    );
    expect(prepararBalance({ ...datos, ingresosEnPuerta: 10.5 }, T0).errores.ingresosEnPuerta).toBe(
      "Escriba un monto en soles, por ejemplo 150.50.",
    );
  });

  it("@HU-ASA-10 limita la cantidad de gastos para que el balance se lea completo", () => {
    const muchos = Array.from({ length: 51 }, () => ({ concepto: "Gasto", monto: 100, archivoId: ARCHIVO }));
    expect(prepararBalance({ ...datos, egresos: muchos }, T0).errores.egresos).toBe(
      "Puede registrar hasta 50 gastos por balance.",
    );
  });
});
