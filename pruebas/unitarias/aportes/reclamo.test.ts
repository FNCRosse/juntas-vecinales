import {
  ajustesPosibles,
  cuotaAjustada,
  MOTIVOS,
  MOTIVOS_RECLAMO,
  numeroDeReclamo,
  prepararDecision,
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

describe("@HU-COB-04 la respuesta de la directiva", () => {
  const lineas = [
    { clave: "casa", nombre: "Casa", montoUnitario: 250, cantidad: 1 },
    { clave: "inquilino", nombre: "Inquilino", montoUnitario: 250, cantidad: 1 },
    { clave: "auto", nombre: "Auto o camioneta", montoUnitario: 500, cantidad: 2 },
  ];

  it("@HU-COB-04 CA2 solo se puede quitar lo que el motivo permite y lo que la cuota tiene", () => {
    expect(ajustesPosibles("SIN_INQUILINO", lineas)).toEqual([
      { clave: "inquilino", nombre: "Inquilino", unitario: 250 },
    ]);
    expect(ajustesPosibles("MENOS_VEHICULOS", lineas)).toEqual([
      { clave: "auto", nombre: "Auto o camioneta", unitario: 500 },
    ]);
    expect(ajustesPosibles("OTRO", lineas).map((a) => a.clave)).toEqual(["inquilino", "auto"]);
    expect(ajustesPosibles("YA_PAGUE", lineas)).toEqual([]);
    expect(
      ajustesPosibles(
        "SIN_INQUILINO",
        lineas.filter((l) => l.clave !== "inquilino"),
      ),
    ).toEqual([]);
    expect(ajustesPosibles("SIN_INQUILINO", [{ ...lineas[1], cantidad: 0 }])).toEqual([]);
  });

  it("@HU-COB-04 CA2 la cuota ajustada baja en una unidad y no pasa de cero", () => {
    expect(cuotaAjustada(500, 500, 250)).toEqual({ montoNuevo: 250, saldoNuevo: 250 });
    expect(cuotaAjustada(500, 100, 250)).toEqual({ montoNuevo: 250, saldoNuevo: 0 });
    expect(cuotaAjustada(200, 200, 250)).toEqual({ montoNuevo: 0, saldoNuevo: 0 });
  });

  it("@HU-COB-04 CA2 CA3 hay que decidir; si se mantiene la cuota hay que explicar el motivo", () => {
    expect(prepararDecision({ decision: "", motivo: "" }).errores.decision).toBe("Elija qué decide.");
    expect(prepararDecision({ decision: "APROBAR", motivo: "" }).errores).toHaveProperty("decision");
    expect(prepararDecision({ decision: "APROBAR:inquilino", motivo: "" })).toEqual({
      errores: {},
      decision: { tipo: "APROBAR", clave: "inquilino" },
    });
    expect(prepararDecision({ decision: "MANTENER", motivo: " " }).errores.motivo).toBe(
      "Escriba el motivo para explicárselo a la casa.",
    );
    expect(
      prepararDecision({ decision: "MANTENER", motivo: " El contrato sigue vigente " }).decision,
    ).toEqual({
      tipo: "MANTENER",
      motivo: "El contrato sigue vigente",
    });
    expect(prepararDecision({ decision: "MANTENER", motivo: "a".repeat(301) }).errores.motivo).toMatch(
      /hasta 300 letras/,
    );
  });
});
