import { prepararActa } from "@/modulos/transparencia/dominio/acta";

// Las 10:00 de Lima del lunes 5 de octubre de 2026.
const T0 = new Date("2026-10-05T15:00:00Z");
const datos = {
  titulo: "Asamblea general de octubre",
  fechaAsamblea: "2026-10-03",
  acuerdos: "Se aprobó la cuota de vigilancia.\nSe aprobó el cierre del parque.",
  compromisos: "La directiva presenta el balance en 15 días.",
  conclusiones: "Asistieron 84 familias.",
};

describe("@HU-ASA-11 Acta digital", () => {
  it("@HU-ASA-11 CA1 limpia los espacios y separa los acuerdos y compromisos por línea", () => {
    const { errores, acta } = prepararActa({ ...datos, titulo: "  Asamblea general de octubre " }, T0);
    expect(errores).toEqual({});
    expect(acta).toMatchObject({
      titulo: "Asamblea general de octubre",
      acuerdos: ["Se aprobó la cuota de vigilancia.", "Se aprobó el cierre del parque."],
      compromisos: ["La directiva presenta el balance en 15 días."],
      conclusiones: "Asistieron 84 familias.",
    });
    expect(acta.fechaAsamblea.toISOString()).toBe("2026-10-03T17:00:00.000Z");
  });

  it("@HU-ASA-11 CA1 exige título, fecha y al menos un acuerdo; compromisos y conclusiones son opcionales", () => {
    const { errores, acta } = prepararActa(
      { titulo: " ", fechaAsamblea: "", acuerdos: "  \n ", compromisos: "", conclusiones: "" },
      T0,
    );
    expect(errores).toEqual({
      titulo: "Escriba el título del acta.",
      fechaAsamblea: "Elija la fecha de la asamblea.",
      acuerdos: "Escriba al menos un acuerdo de la asamblea.",
    });
    expect(acta.compromisos).toEqual([]);
  });

  it("@HU-ASA-11 CA1 no admite una fecha futura ni inexistente", () => {
    expect(prepararActa({ ...datos, fechaAsamblea: "2026-10-06" }, T0).errores.fechaAsamblea).toBe(
      "La fecha de la asamblea no puede ser futura.",
    );
    expect(prepararActa({ ...datos, fechaAsamblea: "2026-02-31" }, T0).errores.fechaAsamblea).toBe(
      "Elija la fecha de la asamblea.",
    );
    expect(prepararActa({ ...datos, fechaAsamblea: "2026-10-05" }, T0).errores).toEqual({});
  });

  it("@HU-ASA-11 CA1 limita el largo para que el PDF y el aviso se lean completos", () => {
    const { errores } = prepararActa(
      { ...datos, titulo: "x".repeat(121), acuerdos: "y".repeat(4001), conclusiones: "z".repeat(2001) },
      T0,
    );
    expect(Object.keys(errores)).toEqual(["titulo", "acuerdos", "conclusiones"]);
  });
});
