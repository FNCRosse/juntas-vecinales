import {
  DIAS_ANTES_DEL_CIERRE_DE_AGENDA,
  MAXIMO_JUSTIFICACION,
  MAXIMO_TITULO,
  prepararPropuesta,
} from "@/modulos/asambleas/dominio/propuesta";

describe("@HU-ASA-13 Proponer un tema para la agenda", () => {
  it("@HU-ASA-13 CA1 limpia el título y la justificación", () => {
    const { errores, propuesta } = prepararPropuesta({
      titulo: "  Cámaras en  la entrada ",
      justificacion: " Hubo dos robos este mes. ",
    });
    expect(errores).toEqual({});
    expect(propuesta).toEqual({ titulo: "Cámaras en la entrada", justificacion: "Hubo dos robos este mes." });
  });

  it("@HU-ASA-13 CA1 pide el título y una breve justificación", () => {
    const { errores } = prepararPropuesta({ titulo: " ", justificacion: "" });
    expect(errores.titulo).toMatch(/tema/i);
    expect(errores.justificacion).toMatch(/importante/i);
  });

  it("@HU-ASA-13 CA1 una justificación breve: no pasa del máximo", () => {
    const larga = "a".repeat(MAXIMO_JUSTIFICACION + 1);
    const { errores } = prepararPropuesta({ titulo: "x".repeat(MAXIMO_TITULO + 1), justificacion: larga });
    expect(errores.titulo).toMatch(String(MAXIMO_TITULO));
    expect(errores.justificacion).toMatch(String(MAXIMO_JUSTIFICACION));
  });

  it("@HU-ASA-13 la agenda se cierra 9 días antes de la asamblea (valor del prototipo)", () => {
    expect(DIAS_ANTES_DEL_CIERRE_DE_AGENDA).toBe(9);
  });
});

import { MOTIVOS_DE_DESCARTE, prepararDecision } from "@/modulos/asambleas/dominio/propuesta";

describe("@HU-ASA-14 Decidir sobre una propuesta", () => {
  it("@HU-ASA-14 CA2 incluir no pide motivo", () => {
    expect(prepararDecision({ decision: "INCLUIR", motivo: "" })).toEqual({ errores: {}, motivo: null });
  });

  it("@HU-ASA-14 CA2 no incluir exige un motivo breve y lo limpia", () => {
    const { errores, motivo } = prepararDecision({ decision: "NO_INCLUIR", motivo: "  Ya se trató  " });
    expect(errores).toEqual({});
    expect(motivo).toBe("Ya se trató");
    expect(prepararDecision({ decision: "NO_INCLUIR", motivo: " " }).errores.motivo).toMatch(/motivo/i);
  });

  it("@HU-ASA-14 CA2 el motivo no pasa de 200 letras", () => {
    expect(prepararDecision({ decision: "NO_INCLUIR", motivo: "a".repeat(201) }).errores.motivo).toMatch(
      /200/,
    );
  });

  it("@HU-ASA-14 CA2 rechaza una decisión desconocida", () => {
    expect(prepararDecision({ decision: "OTRA" as never, motivo: "x" }).errores.decision).toMatch(/incluye/i);
  });

  it("@HU-ASA-14 hay tres motivos sugeridos, los del prototipo", () => {
    expect(MOTIVOS_DE_DESCARTE).toEqual([
      "Ya se trató en otra asamblea",
      "No le corresponde a la junta",
      "Falta información: se la pediremos al vecino",
    ]);
  });
});
