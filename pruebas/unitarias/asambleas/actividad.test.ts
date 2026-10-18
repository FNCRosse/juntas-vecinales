import {
  MAXIMO_UNIDADES,
  modalidadesAdmitidas,
  prepararActividad,
  prepararColaboracion,
  UNIDAD_DE_ACTIVIDAD,
} from "@/modulos/asambleas/dominio/actividad";

const AHORA = new Date("2026-10-01T12:00:00Z");
const VALIDA = {
  tipoActividad: "POLLADA" as const,
  nombre: "  Pollada pro-fondos   para la reja ",
  paraQue: "Reparar la reja principal",
  fechaHora: new Date("2026-10-25T17:00:00Z"),
  lugar: "Parque Central",
  precioUnidad: 1500,
  metaRecaudacion: 120000,
  pagos: "AMBOS" as const,
};

describe("@HU-ASA-08 Actividad pro fondos", () => {
  it("@HU-ASA-08 limpia el nombre y acepta una actividad completa", () => {
    const { errores, actividad } = prepararActividad(VALIDA, AHORA);
    expect(errores).toEqual({});
    expect(actividad.nombre).toBe("Pollada pro-fondos para la reja");
    expect(actividad.precioUnidad).toBe(1500);
  });

  it("@HU-ASA-08 la meta es opcional", () => {
    expect(prepararActividad({ ...VALIDA, metaRecaudacion: null }, AHORA).errores).toEqual({});
  });

  it("@HU-ASA-08 pide cada dato con mensajes en lenguaje llano", () => {
    const { errores } = prepararActividad(
      {
        ...VALIDA,
        nombre: " ",
        paraQue: "",
        lugar: "",
        precioUnidad: null,
        fechaHora: new Date("2026-09-01T00:00:00Z"),
      },
      AHORA,
    );
    expect(errores.nombre).toMatch(/nombre/i);
    expect(errores.paraQue).toMatch(/para qué/i);
    expect(errores.lugar).toMatch(/lugar/i);
    expect(errores.precioUnidad).toMatch(/soles/);
    expect(errores.fechaHora).toMatch(/posterior/);
  });

  it("@HU-ASA-08 el precio y la meta deben ser mayores que cero", () => {
    expect(prepararActividad({ ...VALIDA, precioUnidad: 0 }, AHORA).errores.precioUnidad).toBeDefined();
    expect(prepararActividad({ ...VALIDA, metaRecaudacion: 0 }, AHORA).errores.metaRecaudacion).toBeDefined();
  });

  it("@HU-ASA-08 CA1 las formas de pagar salen de lo que eligió la directiva", () => {
    expect(modalidadesAdmitidas("AMBOS")).toEqual(["ANTICIPADA", "EN_PUERTA"]);
    expect(modalidadesAdmitidas("ANTICIPADO")).toEqual(["ANTICIPADA"]);
    expect(modalidadesAdmitidas("PUERTA")).toEqual(["EN_PUERTA"]);
  });

  it("@HU-ASA-08 CA1 el aporte multiplica la cantidad por el precio, en céntimos", () => {
    const { errores, monto } = prepararColaboracion({ cantidad: 3, modalidad: "EN_PUERTA" }, "AMBOS", 1500);
    expect(errores).toEqual({});
    expect(monto).toBe(4500);
  });

  it("@HU-ASA-08 CA1 la cantidad va de 1 a 10 y la forma de pago debe estar permitida", () => {
    expect(
      prepararColaboracion({ cantidad: 0, modalidad: "EN_PUERTA" }, "AMBOS", 1500).errores.cantidad,
    ).toBeDefined();
    expect(
      prepararColaboracion({ cantidad: MAXIMO_UNIDADES + 1, modalidad: "EN_PUERTA" }, "AMBOS", 1500).errores
        .cantidad,
    ).toBeDefined();
    expect(
      prepararColaboracion({ cantidad: 2, modalidad: "ANTICIPADA" }, "PUERTA", 1500).errores.modalidad,
    ).toMatch(/no está disponible/);
  });

  it("@HU-ASA-08 las comidas cuentan platos y el bingo y la rifa, boletos", () => {
    expect(UNIDAD_DE_ACTIVIDAD.POLLADA.plural).toBe("platos");
    expect(UNIDAD_DE_ACTIVIDAD.BINGO.singular).toBe("boleto");
  });
});
