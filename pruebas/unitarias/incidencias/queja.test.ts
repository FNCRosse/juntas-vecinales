import {
  codigoTicket,
  lugarEnTexto,
  numeroVisible,
  prepararQueja,
  sufijoAleatorio,
} from "@/modulos/incidencias/dominio/queja";

const ARCHIVO = "6f1c2a3b-0000-4000-8000-000000000001";
const completa = {
  categoria: "RUIDOS",
  descripcion: " Música muy fuerte todas las noches ",
  manzana: "C",
  referencia: " frente al parque ",
  evidencias: [ARCHIVO],
  consentimiento: true,
};

describe("@HU-QUE-01 Registrar una queja con consentimiento y evidencia", () => {
  it("@HU-QUE-01 CA2 CA3 con todo completo, limpia los textos y no deja errores", () => {
    const { errores, queja } = prepararQueja(completa);
    expect(errores).toEqual({});
    expect(queja).toEqual({
      categoria: "RUIDOS",
      descripcion: "Música muy fuerte todas las noches",
      manzana: "C",
      referencia: "frente al parque",
      latitud: null,
      longitud: null,
      evidencias: [ARCHIVO],
      esAnonimo: false,
    });
  });

  it("@HU-QUE-01 CA1 CA2 CA3 sin consentimiento, categoría, descripción, lugar ni evidencia dice qué falta en cada campo", () => {
    const { errores } = prepararQueja({
      categoria: null,
      descripcion: "  ",
      manzana: " ",
      evidencias: [],
      consentimiento: false,
    });
    expect(errores).toEqual({
      categoria: "Elija qué tipo de problema es.",
      descripcion:
        'Falta contar qué pasó. Unas pocas palabras bastan, por ejemplo: "música fuerte de noche".',
      lugar: 'Falta el lugar. Pulse "Cerca de mi casa" o elija la manzana.',
      evidencias:
        "Falta una foto o video. Si no puede tomarla, pida ayuda a una persona y la directiva registrará su reporte.",
      consentimiento: "Falta marcar esta casilla. Es necesaria para registrar el reporte.",
    });
  });

  it("@HU-QUE-01 CA2 rechaza una categoría que no existe y más de tres evidencias", () => {
    const { errores } = prepararQueja({
      ...completa,
      categoria: "OTRA_COSA",
      evidencias: ["a", "b", "c", "d"],
    });
    expect(errores.categoria).toBe("Elija qué tipo de problema es.");
    expect(errores.evidencias).toBe("Adjunte hasta 3 fotos o videos.");
  });

  it("@HU-QUE-01 CA3 otro lugar del barrio pide la referencia; una ubicación inválida se rechaza", () => {
    expect(prepararQueja({ ...completa, manzana: null, referencia: "" }).errores.lugar).toBe(
      "Escriba dónde fue, por ejemplo: la esquina del parque.",
    );
    expect(prepararQueja({ ...completa, referencia: "x".repeat(121) }).errores.lugar).toBe(
      "Escriba la referencia en menos de 120 letras.",
    );
    expect(prepararQueja({ ...completa, latitud: -12.04 }).errores.lugar).toBe(
      "No pudimos leer su ubicación. Vuelva a pulsar el botón o elija la manzana.",
    );
    expect(prepararQueja({ ...completa, descripcion: "x".repeat(1001) }).errores.descripcion).toBe(
      "Cuéntelo en menos de 1000 letras.",
    );
    const conUbicacion = prepararQueja({ ...completa, latitud: -12.0431, longitud: -77.0282 });
    expect(conUbicacion.errores).toEqual({});
    expect(conUbicacion.queja).toMatchObject({ latitud: -12.0431, longitud: -77.0282 });
  });

  it("@HU-QUE-01 describe el lugar en palabras", () => {
    expect(lugarEnTexto("C", "frente al parque")).toBe("Mz. C, frente al parque");
    expect(lugarEnTexto("D", null)).toBe("Mz. D");
    expect(lugarEnTexto(null, "la esquina del mercado")).toBe(
      "Otro lugar del barrio: la esquina del mercado",
    );
  });
});

describe("@HU-QUE-04 Ticket correlativo intransferible", () => {
  it("@HU-QUE-04 CA1 arma el código con el año, el correlativo de 5 dígitos y un sufijo que no se adivina", () => {
    let i = 0;
    const sufijo = sufijoAleatorio(() => [7, 0, 30, 22][i++]);
    expect(sufijo).toBe("HA9Z");
    expect(codigoTicket(2026, 142, sufijo)).toBe("Q-2026-00142-HA9Z");
    expect(numeroVisible(142)).toBe("N.° 00142");
    expect(sufijoAleatorio((n) => Math.floor(Math.random() * n))).toMatch(/^[A-HJKMNP-Z2-9]{4}$/);
  });
});

describe("@HU-QUE-03 Queja asistida", () => {
  it("@HU-QUE-03 CA1 en la queja asistida la foto es opcional y el consentimiento lo confirma el mediador", () => {
    const { errores } = prepararQueja(
      { ...completa, evidencias: [], consentimiento: false },
      { asistida: true },
    );
    expect(errores).toEqual({ consentimiento: "Confirme que el vecino aceptó la política de privacidad." });
  });
});
