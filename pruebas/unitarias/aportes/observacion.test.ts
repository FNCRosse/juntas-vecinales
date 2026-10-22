import {
  MOTIVOS,
  MOTIVOS_OBSERVACION,
  prepararObservacion,
  textoParaLaVecina,
} from "@/modulos/aportes/dominio/observacion";

describe("@HU-COB-10 CA1 motivos de una observación", () => {
  it("@HU-COB-10 CA1 ofrece los motivos tipificados y «otro motivo», con su palabra en llano", () => {
    expect(MOTIVOS_OBSERVACION).toEqual(["MONTO_INSUFICIENTE", "IMAGEN_BORROSA", "FECHA_ERRONEA", "OTRO"]);
    expect(MOTIVOS.MONTO_INSUFICIENTE.etiqueta).toBe("Monto insuficiente");
    expect(MOTIVOS.IMAGEN_BORROSA.etiqueta).toBe("La imagen se ve borrosa");
    expect(MOTIVOS.FECHA_ERRONEA.etiqueta).toBe("La fecha no coincide");
    expect(MOTIVOS.OTRO.etiqueta).toBe("Otro motivo");
  });

  it("@HU-COB-10 CA1 hay que elegir un motivo de la lista", () => {
    expect(prepararObservacion({ motivo: "", nota: "" }).errores.motivo).toBe("Elija por qué lo observa.");
    expect(prepararObservacion({ motivo: "RARO", nota: "" }).errores.motivo).toBe(
      "Elija por qué lo observa.",
    );
    expect(prepararObservacion({ motivo: "IMAGEN_BORROSA", nota: "" })).toEqual({
      errores: {},
      observacion: { motivo: "IMAGEN_BORROSA", nota: null },
    });
  });

  it("@HU-COB-10 CA1 «otro motivo» pide la nota y ninguna nota pasa de 300 letras", () => {
    expect(prepararObservacion({ motivo: "OTRO", nota: "  " }).errores.nota).toBe(
      "Escriba cuál es el motivo.",
    );
    expect(prepararObservacion({ motivo: "OTRO", nota: "Falta el nombre del titular" }).observacion).toEqual({
      motivo: "OTRO",
      nota: "Falta el nombre del titular",
    });
    expect(prepararObservacion({ motivo: "IMAGEN_BORROSA", nota: "a".repeat(301) }).errores.nota).toMatch(
      /hasta 300 letras/,
    );
  });
});

describe("@HU-COB-10 CA2 lo que lee la vecina", () => {
  it("@HU-COB-10 CA2 cada motivo se dice en llano, con qué hacer, y sin culpar", () => {
    expect(textoParaLaVecina("IMAGEN_BORROSA", null)).toEqual({
      resumen: "la foto se ve borrosa",
      titulo: "La directiva no pudo leer la foto",
      texto: "Solo necesitan una foto más clara, donde se vean el monto y la fecha.",
    });
    expect(textoParaLaVecina("MONTO_INSUFICIENTE", null)).toMatchObject({
      resumen: "el monto no alcanza",
      texto: "Envíe otra foto donde se vea el monto completo, o pague la diferencia desde Mi cuota.",
    });
    expect(textoParaLaVecina("FECHA_ERRONEA", null).texto).toBe(
      "Envíe otra foto donde se vea la fecha de su pago.",
    );
  });

  it("@HU-COB-10 CA2 la nota de la directiva se suma al texto y reemplaza el motivo cuando es «otro»", () => {
    expect(textoParaLaVecina("FECHA_ERRONEA", "Falta el día.").texto).toBe(
      "Envíe otra foto donde se vea la fecha de su pago. Falta el día.",
    );
    expect(textoParaLaVecina("OTRO", "Falta el nombre del titular")).toEqual({
      resumen: "falta el nombre del titular",
      titulo: "La directiva necesita revisar algo",
      texto: "Falta el nombre del titular. Envíe otra foto cuando pueda.",
    });
  });
});
