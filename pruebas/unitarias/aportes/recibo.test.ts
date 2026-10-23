import {
  codigoDeVerificacion,
  FRANJAS,
  FRANJAS_DE_VISITA,
  numeroDePedido,
  numeroDeRecibo,
  prepararPedidoDeRecibo,
} from "@/modulos/aportes/dominio/recibo";

describe("@HU-COB-12 CA1 número y código del recibo", () => {
  it("@HU-COB-12 CA1 el número tiene seis cifras y el del pedido empieza con R", () => {
    expect(numeroDeRecibo(321)).toBe("000321");
    expect(numeroDeRecibo(1234567)).toBe("1234567");
    expect(numeroDePedido(8)).toBe("R-008");
  });

  it("@HU-COB-12 CA1 el código lleva el número, siempre sale igual y cambia si cambia el pago o el monto", () => {
    const codigo = codigoDeVerificacion(321, "pago-a", 1000);
    expect(codigo).toMatch(/^JV-000321-[0-9A-F]{4}$/);
    expect(codigoDeVerificacion(321, "pago-a", 1000)).toBe(codigo);
    expect(codigoDeVerificacion(321, "pago-a", 1001)).not.toBe(codigo);
    expect(codigoDeVerificacion(321, "pago-b", 1000)).not.toBe(codigo);
  });
});

describe("@HU-COB-12 CA2 pedir el recibo en papel", () => {
  it("@HU-COB-12 CA2 hay tres franjas, con la hora en llano", () => {
    expect(FRANJAS_DE_VISITA).toEqual(["MANANA", "TARDE", "NOCHE"]);
    expect(FRANJAS.MANANA).toMatchObject({ etiqueta: "En la mañana", detalle: "De 8:00 a. m. a 12:00 m." });
    expect(FRANJAS.NOCHE.resumen).toBe("Noche, de 6:00 p. m. a 8:00 p. m.");
  });

  it("@HU-COB-12 CA2 hay que elegir el recibo y la franja; la nota es opcional y corta", () => {
    expect(prepararPedidoDeRecibo({ reciboId: "", franja: "", nota: "" }).errores).toEqual({
      reciboId: "Elija qué recibo necesita.",
      franja: "Elija a qué hora le queda mejor que vayan.",
    });
    expect(prepararPedidoDeRecibo({ reciboId: "r", franja: "TARDE", nota: " Tocar el timbre " })).toEqual({
      errores: {},
      pedido: { reciboId: "r", franja: "TARDE", nota: "Tocar el timbre" },
    });
    expect(prepararPedidoDeRecibo({ reciboId: "r", franja: "TARDE", nota: "" }).pedido?.nota).toBeNull();
    expect(
      prepararPedidoDeRecibo({ reciboId: "r", franja: "TARDE", nota: "a".repeat(301) }).errores.nota,
    ).toMatch(/hasta 300 letras/);
  });
});
