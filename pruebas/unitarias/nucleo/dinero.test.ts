import { aCentimos, soles } from "@/compartido/dinero";

describe("@HU-INFRA Dinero en céntimos enteros (CLAUDE.md regla 8)", () => {
  it("@HU-INFRA lee lo que escribe una persona en soles y lo pasa a céntimos sin decimales flotantes", () => {
    expect(aCentimos("1250")).toBe(125000);
    expect(aCentimos("1250.5")).toBe(125050);
    expect(aCentimos("1,250.50")).toBe(125050);
    expect(aCentimos(" S/ 5.00 ")).toBe(500);
    expect(aCentimos("0.07")).toBe(7);
    expect(aCentimos("19.99")).toBe(1999);
    expect(aCentimos("0")).toBe(0);
  });

  it("@HU-INFRA rechaza lo que no es un monto: vacío, texto, negativo o con más de dos decimales", () => {
    for (const malo of ["", "  ", "abc", "-5", "5.123", "1.2.3", "5,5,5x"])
      expect(aCentimos(malo)).toBeNull();
  });

  it("@HU-INFRA muestra los céntimos como los lee la gente en es-PE", () => {
    expect(soles(125050)).toBe("S/ 1,250.50");
    expect(soles(500)).toBe("S/ 5.00");
    expect(soles(0)).toBe("S/ 0.00");
    expect(soles(-2575)).toBe("−S/ 25.75");
  });
});
