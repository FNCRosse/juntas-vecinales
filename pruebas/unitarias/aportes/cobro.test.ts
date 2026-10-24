import {
  fechaDelCobro,
  prepararLiquidacion,
  numeroDePedidoDeCobro,
  prepararPedidoDeCobro,
  repartirCobro,
  validarMontoCobrado,
} from "@/modulos/aportes/dominio/cobro";

const CUOTAS = [
  { id: "a", saldo: 500 },
  { id: "b", saldo: 500 },
  { id: "c", saldo: 500 },
];

describe("@HU-COB-11 CA1 repartir lo recibido", () => {
  it("@HU-COB-11 CA1 el pedido de cobro se numera «C-021»", () => {
    expect(numeroDePedidoDeCobro(21)).toBe("C-021");
  });

  it("@HU-COB-11 CA1 lo recibido paga primero las cuotas más antiguas", () => {
    expect(repartirCobro(1500, CUOTAS)).toEqual({
      partes: [
        { cuotaId: "a", monto: 500 },
        { cuotaId: "b", monto: 500 },
        { cuotaId: "c", monto: 500 },
      ],
      aplicado: 1500,
      excedente: 0,
    });
    expect(repartirCobro(750, CUOTAS)).toEqual({
      partes: [
        { cuotaId: "a", monto: 500 },
        { cuotaId: "b", monto: 250 },
      ],
      aplicado: 750,
      excedente: 0,
    });
  });

  it("@HU-COB-11 CA1 lo que sobra no se pierde: queda como excedente", () => {
    expect(repartirCobro(1700, CUOTAS)).toMatchObject({ aplicado: 1500, excedente: 200 });
    expect(repartirCobro(500, [])).toEqual({ partes: [], aplicado: 0, excedente: 500 });
    expect(repartirCobro(500, [{ id: "z", saldo: 0 }])).toMatchObject({ partes: [], excedente: 500 });
  });
});

describe("@HU-COB-11 pedido y monto", () => {
  it("@HU-COB-11 el pedido pide cuánto y a qué hora; la nota es opcional y corta", () => {
    expect(prepararPedidoDeCobro({ semanas: 0, franja: "", nota: "" }).errores).toEqual({
      semanas: "Elija cuánto va a pagar.",
      franja: "Elija a qué hora le queda mejor que vayan.",
    });
    expect(prepararPedidoDeCobro({ semanas: 3, franja: "MANANA", nota: " Tocar " })).toEqual({
      errores: {},
      pedido: { semanas: 3, franja: "MANANA", nota: "Tocar" },
    });
    expect(
      prepararPedidoDeCobro({ semanas: 3, franja: "MANANA", nota: "a".repeat(301) }).errores.nota,
    ).toMatch(/hasta 300 letras/);
  });

  it("@HU-COB-11 CA1 el monto cobrado es entero y mayor que cero", () => {
    expect(validarMontoCobrado(750)).toBeNull();
    expect(validarMontoCobrado(0)).toMatch(/mayor que cero/);
    expect(validarMontoCobrado(-5)).toMatch(/mayor que cero/);
    expect(validarMontoCobrado(7.5)).toMatch(/mayor que cero/);
  });

  it("@HU-COB-11 CA2 la hora del cobro es la del teléfono; si es del futuro o ilegible, la de llegada", () => {
    const ahora = new Date("2026-09-28T15:00:00Z");
    expect(fechaDelCobro("2026-09-27T16:05:00Z", ahora)).toEqual(new Date("2026-09-27T16:05:00Z"));
    expect(fechaDelCobro("2026-10-30T16:05:00Z", ahora)).toBe(ahora);
    expect(fechaDelCobro("no es fecha", ahora)).toBe(ahora);
    expect(fechaDelCobro(undefined, ahora)).toBe(ahora);
  });
});

describe("@HU-COB-07 CA1 cómo pagó la deuda acumulada", () => {
  it("@HU-COB-07 CA1 hay que elegir cómo pagó; el número de operación es opcional", () => {
    expect(prepararLiquidacion({ medio: "", numeroOperacion: "" }).errores).toEqual({
      medio: "Elija cómo pagó.",
    });
    expect(prepararLiquidacion({ medio: "EFECTIVO", numeroOperacion: " " })).toEqual({
      errores: {},
      liquidacion: { medio: "EFECTIVO", numeroOperacion: null },
    });
    expect(prepararLiquidacion({ medio: "YAPE_O_PLIN", numeroOperacion: " 0045123 " }).liquidacion).toEqual({
      medio: "YAPE_O_PLIN",
      numeroOperacion: "0045123",
    });
    expect(
      prepararLiquidacion({ medio: "TRANSFERENCIA", numeroOperacion: "9".repeat(31) }).errores,
    ).toHaveProperty("numeroOperacion");
  });
});
