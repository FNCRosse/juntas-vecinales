import {
  estadoDelEnlace,
  interpretarIdentificador,
  MAX_ENLACES_POR_HORA,
  puedeEmitirOtro,
} from "@/modulos/identidad/dominio/magicLink";

const T0 = new Date("2026-10-05T15:00:00Z");
const segundos = (s: number) => new Date(T0.getTime() + s * 1000);

describe("@HU-GAR-11 Identificar al vecino sin enlace", () => {
  it.each([
    ["08123478", { dni: "08123478" }],
    [" 08123478 ", { dni: "08123478" }],
    ["Mz. C lote 7", { manzana: "C", lote: "7" }],
    ["mz c, lote 7", { manzana: "C", lote: "7" }],
    ["C-7", { manzana: "C", lote: "7" }],
    ["c 12a", { manzana: "C", lote: "12A" }],
    ["Manzana B lt. 11", { manzana: "B", lote: "11" }],
  ])("@HU-GAR-11 CA1 entiende «%s»", (texto, esperado) => {
    expect(interpretarIdentificador(texto)).toEqual(esperado);
  });

  it.each(["123", "Calle Lima 123", "", "CC 7"])("@HU-GAR-11 CA1 no adivina con «%s»", (texto) => {
    expect(interpretarIdentificador(texto)).toBeNull();
  });
});

describe("@HU-GAR-11 Límite de enlaces", () => {
  it("@HU-GAR-11 CA3 uno por minuto y cinco por hora", () => {
    expect(puedeEmitirOtro([], T0)).toBe("SI");
    expect(puedeEmitirOtro([T0], segundos(59))).toBe("MUY_SEGUIDO");
    expect(puedeEmitirOtro([T0], segundos(60))).toBe("SI");
    const cinco = Array.from({ length: MAX_ENLACES_POR_HORA }, (_, i) => segundos(i * 120));
    expect(puedeEmitirOtro(cinco, segundos(3000))).toBe("EN_PAUSA");
  });

  it("@HU-GAR-02 CA1 el estado del enlace: usado, anulado, vencido o vigente", () => {
    const base = { usadoEn: null, anuladoEn: null, expiraEn: segundos(900) };
    expect(estadoDelEnlace(base, T0)).toBe("VIGENTE");
    expect(estadoDelEnlace(base, segundos(900))).toBe("VENCIDO");
    expect(estadoDelEnlace({ ...base, anuladoEn: T0 }, T0)).toBe("ANULADO");
    expect(estadoDelEnlace({ ...base, usadoEn: T0, anuladoEn: T0 }, T0)).toBe("USADO");
  });
});
