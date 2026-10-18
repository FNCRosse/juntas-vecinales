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
