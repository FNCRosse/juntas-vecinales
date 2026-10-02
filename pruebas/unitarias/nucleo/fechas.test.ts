import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";

describe("@HU-ACC-08 Fechas en palabras y en hora de Lima", () => {
  it("@HU-ACC-08 la fecha va en palabras, como en el prototipo", () => {
    expect(fechaLarga(new Date("2026-09-27T15:00:00Z"))).toBe("Domingo 27 de setiembre de 2026");
    // 3:00 a. m. UTC del lunes todavía es domingo en Lima.
    expect(fechaLarga(new Date("2026-09-28T03:00:00Z"))).toBe("Domingo 27 de setiembre de 2026");
  });

  it("@HU-ACC-08 el saludo sigue la hora de Lima", () => {
    expect(saludo(new Date("2026-09-27T14:00:00Z"))).toBe("Buenos días"); // 9:00 a. m.
    expect(saludo(new Date("2026-09-27T20:00:00Z"))).toBe("Buenas tardes"); // 3:00 p. m.
    expect(saludo(new Date("2026-09-28T01:00:00Z"))).toBe("Buenas noches"); // 8:00 p. m.
    expect(primerNombre("  Ana Flores ")).toBe("Ana");
  });
});
