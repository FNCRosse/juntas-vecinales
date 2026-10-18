import {
  eximeDeCuota,
  MAXIMO_DESCRIPCION,
  prepararDecisionVoluntariado,
  prepararVoluntariado,
} from "@/modulos/asambleas/dominio/voluntariado";

describe("@HU-ASA-09 Voluntariado", () => {
  it("@HU-ASA-09 CA1 pide que cuente cómo ayudaría y limpia el texto", () => {
    expect(prepararVoluntariado({ descripcion: "  Puedo   atender la mesa " })).toEqual({
      errores: {},
      descripcion: "Puedo atender la mesa",
    });
    expect(prepararVoluntariado({ descripcion: " " }).errores.descripcion).toMatch(/ayudar/);
  });

  it("@HU-ASA-09 CA1 la descripción no pasa del máximo", () => {
    const { errores } = prepararVoluntariado({ descripcion: "a".repeat(MAXIMO_DESCRIPCION + 1) });
    expect(errores.descripcion).toMatch(String(MAXIMO_DESCRIPCION));
  });

  it("@HU-ASA-09 CA2 aprobar exige registrar el rol asignado", () => {
    expect(prepararDecisionVoluntariado({ decision: "APROBAR", rol: " Cocina " })).toEqual({
      errores: {},
      rol: "Cocina",
    });
    expect(prepararDecisionVoluntariado({ decision: "APROBAR", rol: "" }).errores.rol).toMatch(/rol/i);
  });

  it("@HU-ASA-09 CA2 no aprobar no pide rol", () => {
    expect(prepararDecisionVoluntariado({ decision: "NO_APROBAR", rol: "" })).toEqual({
      errores: {},
      rol: null,
    });
  });

  it("@HU-ASA-09 CA2 rechaza una decisión desconocida", () => {
    expect(prepararDecisionVoluntariado({ decision: "OTRA" as never, rol: "x" }).errores.decision).toMatch(
      /aprueba/,
    );
  });

  it("@HU-ASA-09 CA3 solo el voluntario aprobado queda exento de la cuota", () => {
    expect(eximeDeCuota("APROBADO")).toBe(true);
    expect(eximeDeCuota("PENDIENTE")).toBe(false);
    expect(eximeDeCuota("NO_APROBADO")).toBe(false);
  });
});
