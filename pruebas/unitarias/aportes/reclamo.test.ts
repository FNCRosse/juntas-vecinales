import {
  MOTIVOS,
  MOTIVOS_RECLAMO,
  numeroDeReclamo,
  prepararReclamo,
} from "@/modulos/aportes/dominio/reclamo";

describe("@HU-COB-03 CA1 motivos del reclamo", () => {
  it("@HU-COB-03 CA1 la lista ofrece los motivos del prototipo, con su palabra en llano", () => {
    expect(MOTIVOS_RECLAMO).toEqual(["SIN_INQUILINO", "MENOS_VEHICULOS", "YA_PAGUE", "OTRO"]);
    expect(MOTIVOS.SIN_INQUILINO).toBe("Ya no tengo inquilino");
    expect(MOTIVOS.MENOS_VEHICULOS).toBe("Tengo menos autos o motos de lo que figura");
    expect(MOTIVOS.YA_PAGUE).toBe("Ya pagué y no aparece");
    expect(MOTIVOS.OTRO).toBe("Otro motivo");
  });

  it("@HU-COB-03 CA1 el número se escribe con cuatro cifras", () => {
    expect(numeroDeReclamo(27)).toBe("R-0027");
    expect(numeroDeReclamo(12345)).toBe("R-12345");
  });

  it("@HU-COB-03 CA1 hay que elegir un motivo de la lista; contar más es opcional", () => {
    expect(prepararReclamo({ motivo: "", detalle: "" }).errores.motivo).toBe(
      "Elija por qué cree que su cuota no es correcta.",
    );
    expect(prepararReclamo({ motivo: "RARO", detalle: "" }).errores).toHaveProperty("motivo");
    expect(prepararReclamo({ motivo: "SIN_INQUILINO", detalle: " Se mudó en agosto " })).toEqual({
      errores: {},
      reclamo: { motivo: "SIN_INQUILINO", detalle: "Se mudó en agosto" },
    });
    expect(prepararReclamo({ motivo: "YA_PAGUE", detalle: "" }).reclamo).toEqual({
      motivo: "YA_PAGUE",
      detalle: null,
    });
  });

  it("@HU-COB-03 CA1 «otro motivo» pide contar cuál es y nada pasa de 300 letras", () => {
    expect(prepararReclamo({ motivo: "OTRO", detalle: " " }).errores.detalle).toBe(
      "Cuéntenos cuál es el motivo.",
    );
    expect(prepararReclamo({ motivo: "YA_PAGUE", detalle: "a".repeat(301) }).errores.detalle).toMatch(
      /hasta 300 letras/,
    );
  });
});
