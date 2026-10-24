import {
  MEDIOS,
  MEDIOS_DIGITALES,
  numeroDeConstancia,
  opcionesDePago,
  rangoDeSemanas,
} from "@/modulos/aportes/dominio/pago";

const cuota = (periodo: string, saldo = 500) => ({ id: `c-${periodo}`, periodo, saldo });
const TRES = [cuota("2026-09-07"), cuota("2026-09-14"), cuota("2026-09-21")];

describe("@HU-COB-08 cuánto puede pagar la casa", () => {
  it("@HU-COB-08 ofrece pagar todo lo pendiente o solo las primeras semanas, de la más antigua en adelante", () => {
    const opciones = opcionesDePago(TRES);
    expect(opciones.map((o) => [o.semanas, o.monto, o.titulo, o.detalle])).toEqual([
      [3, 1500, "Todo lo pendiente", "3 semanas, del 7 al 27 de setiembre"],
      [2, 1000, "2 semanas", "Del 7 al 20 de setiembre"],
      [1, 500, "1 semana", "Del 7 al 13 de setiembre"],
    ]);
    expect(opciones[1].cuotaIds).toEqual(["c-2026-09-07", "c-2026-09-14"]);
  });

  it("@HU-COB-08 suma el saldo que falta de cada semana, no el monto entero", () => {
    const [todo, , una] = opcionesDePago([
      cuota("2026-09-07", 200),
      cuota("2026-09-14"),
      cuota("2026-09-21"),
    ]);
    expect(todo.monto).toBe(1200);
    expect(una.monto).toBe(200);
  });

  it("@HU-COB-08 con muchas semanas pendientes no ofrece una opción por cada una", () => {
    const muchas = Array.from({ length: 12 }, (_, i) => cuota(`2026-0${(i % 9) + 1}-01`, 100));
    expect(opcionesDePago(muchas).map((o) => o.semanas)).toEqual([12, 8, 4, 3, 2, 1]);
  });

  it("@HU-COB-08 sin semanas pendientes no hay nada que pagar", () => {
    expect(opcionesDePago([])).toEqual([]);
  });

  it("@HU-COB-08 el rango de semanas cruza de mes sin repetir el mes", () => {
    expect(rangoDeSemanas("2026-09-28", "2026-10-12")).toBe("del 28 de setiembre al 18 de octubre");
    expect(rangoDeSemanas("2026-09-07", "2026-09-14")).toBe("del 7 al 20 de setiembre");
  });
});

describe("@HU-COB-08 constancia de envío", () => {
  it("@HU-COB-08 el número de la constancia es correlativo y de cuatro cifras como mínimo", () => {
    expect(numeroDeConstancia(917)).toBe("E-0917");
    expect(numeroDeConstancia(12345)).toBe("E-12345");
  });

  it("@HU-COB-08 los medios de pago digital se dicen como los ve la vecina", () => {
    expect(MEDIOS).toEqual({
      YAPE_O_PLIN: "Yape o Plin",
      TRANSFERENCIA: "Transferencia bancaria",
      EFECTIVO: "Efectivo, en su casa",
    });
    expect(MEDIOS_DIGITALES).toEqual(["YAPE_O_PLIN", "TRANSFERENCIA"]);
  });
});
