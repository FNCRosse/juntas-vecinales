import {
  aplicarCambio,
  claveDe,
  type Concepto,
  opcionesDeVigencia,
  prepararCambio,
  separarVersiones,
  siguienteCiclo,
  textoDelCambio,
} from "@/modulos/aportes/dominio/tarifa";

const CONCEPTOS: Concepto[] = [
  { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250 },
  { clave: "auto", nombre: "Auto o camioneta", unidad: "POR_VEHICULO", monto: 200 },
];

// Sábado 26 de setiembre de 2026, 10:00 a. m. en Lima.
const AHORA = new Date("2026-09-26T15:00:00Z");

const datos = (cambios: Record<string, unknown> = {}) => ({
  concepto: "auto",
  monto: 250,
  vigencia: "2026-09-28",
  acta: "Acta de asamblea del 20 de setiembre de 2026",
  ...cambios,
});

describe("@HU-COB-16 CA2 ciclo semanal y vigencia", () => {
  it("@HU-COB-16 CA2 el siguiente ciclo es el lunes más próximo después de hoy, en hora de Lima", () => {
    expect(siguienteCiclo(AHORA)).toBe("2026-09-28");
    // Un lunes a las 8:00 p. m. de Lima ya es martes en UTC: el ciclo de ese lunes ya empezó.
    expect(siguienteCiclo(new Date("2026-09-29T01:00:00Z"))).toBe("2026-10-05");
    // El domingo antes de la medianoche de Lima todavía es domingo.
    expect(siguienteCiclo(new Date("2026-09-28T04:30:00Z"))).toBe("2026-09-28");
  });

  it("@HU-COB-16 CA2 ofrece los tres lunes siguientes y, si hay un cambio programado, desde esa fecha", () => {
    expect(opcionesDeVigencia(AHORA)).toEqual(["2026-09-28", "2026-10-05", "2026-10-12"]);
    expect(opcionesDeVigencia(AHORA, "2026-10-05")).toEqual(["2026-10-05", "2026-10-12", "2026-10-19"]);
  });
});

describe("@HU-COB-16 CA1 CA2 validar un cambio de tarifa", () => {
  it("@HU-COB-16 CA1 cambiar el monto de un concepto existente", () => {
    const { errores, cambio } = prepararCambio(datos(), CONCEPTOS, AHORA);
    expect(errores).toEqual({});
    expect(cambio).toMatchObject({
      tipo: "CAMBIAR",
      concepto: { clave: "auto", nombre: "Auto o camioneta", unidad: "POR_VEHICULO", monto: 250 },
      montoAnterior: 200,
      vigencia: "2026-09-28",
      acta: "Acta de asamblea del 20 de setiembre de 2026",
    });
    expect(cambio?.vigenciaDesde.toISOString()).toBe("2026-09-28T05:00:00.000Z");
  });

  it("@HU-COB-16 CA1 agregar un concepto nuevo con su nombre y su unidad de cobro", () => {
    const { errores, cambio } = prepararCambio(
      datos({ concepto: "nuevo", nombre: "  Bicicleta  ", unidad: "POR_VEHICULO", monto: 100 }),
      CONCEPTOS,
      AHORA,
    );
    expect(errores).toEqual({});
    expect(cambio).toMatchObject({
      tipo: "AGREGAR",
      concepto: { clave: "bicicleta", nombre: "Bicicleta", unidad: "POR_VEHICULO", monto: 100 },
      montoAnterior: null,
    });
  });

  it("@HU-COB-16 CA2 la vigencia solo puede ser desde el siguiente ciclo y un lunes", () => {
    expect(prepararCambio(datos({ vigencia: "2026-09-21" }), CONCEPTOS, AHORA).errores.vigencia).toBe(
      "Solo rige desde el siguiente ciclo semanal en adelante: el lunes 28 de setiembre de 2026.",
    );
    expect(prepararCambio(datos({ vigencia: "2026-09-30" }), CONCEPTOS, AHORA).errores.vigencia).toBe(
      "La tarifa cambia los lunes, cuando empieza la semana. Elija un lunes.",
    );
    expect(prepararCambio(datos({ vigencia: "" }), CONCEPTOS, AHORA).errores.vigencia).toBe(
      "Elija desde cuándo rige.",
    );
  });

  it("@HU-COB-16 CA2 la referencia al acta es obligatoria", () => {
    expect(prepararCambio(datos({ acta: "   " }), CONCEPTOS, AHORA).errores.acta).toBe(
      "Escriba el acta de asamblea que lo aprobó.",
    );
    expect(prepararCambio(datos({ acta: "a".repeat(121) }), CONCEPTOS, AHORA).errores.acta).toMatch(
      /hasta 120 letras/,
    );
  });

  it("@HU-COB-16 CA1 el monto debe ser positivo, distinto del de hoy y razonable", () => {
    const mensaje = "Escriba un monto en soles, por ejemplo 2.50.";
    expect(prepararCambio(datos({ monto: null }), CONCEPTOS, AHORA).errores.monto).toBe(mensaje);
    expect(prepararCambio(datos({ monto: 0 }), CONCEPTOS, AHORA).errores.monto).toBe(mensaje);
    expect(prepararCambio(datos({ monto: 12.5 }), CONCEPTOS, AHORA).errores.monto).toBe(mensaje);
    expect(prepararCambio(datos({ monto: 100_001 }), CONCEPTOS, AHORA).errores.monto).toMatch(/S\/ 1,000.00/);
    expect(prepararCambio(datos({ monto: 200 }), CONCEPTOS, AHORA).errores.monto).toBe(
      "Es el mismo monto de hoy. Escriba el monto nuevo que aprobó la asamblea.",
    );
  });

  it("@HU-COB-16 CA1 un concepto nuevo pide nombre y cómo se cobra, y no repite uno que ya existe", () => {
    const nuevo = (cambios: Record<string, unknown>) =>
      prepararCambio(
        datos({ concepto: "nuevo", unidad: "POR_LOCAL", nombre: "Kiosco", ...cambios }),
        CONCEPTOS,
        AHORA,
      );
    expect(nuevo({ nombre: " " }).errores.nombre).toBe("Escriba el nombre del concepto nuevo.");
    expect(nuevo({ nombre: "a".repeat(41) }).errores.nombre).toMatch(/hasta 40 letras/);
    expect(nuevo({ nombre: "casa" }).errores.nombre).toBe("Ya hay un concepto con ese nombre.");
    expect(nuevo({ unidad: "OTRA" }).errores.unidad).toBe("Elija cómo se cobra.");
    // El monto de un concepto nuevo no se compara con uno anterior.
    expect(nuevo({}).errores).toEqual({});
  });

  it("@HU-COB-16 CA1 el concepto debe estar en la lista", () => {
    expect(prepararCambio(datos({ concepto: "otro" }), CONCEPTOS, AHORA).errores.concepto).toBe(
      "Elija un concepto de la lista.",
    );
  });
});

describe("@HU-COB-16 CA3 versiones, historial y lista nueva", () => {
  it("@HU-COB-16 CA3 aplicar un cambio no toca la lista anterior", () => {
    const { cambio } = prepararCambio(datos(), CONCEPTOS, AHORA);
    const nueva = aplicarCambio(CONCEPTOS, cambio!);
    expect(nueva.find((c) => c.clave === "auto")?.monto).toBe(250);
    expect(CONCEPTOS.find((c) => c.clave === "auto")?.monto).toBe(200);
    const agregado = prepararCambio(
      datos({ concepto: "nuevo", nombre: "Kiosco", unidad: "POR_LOCAL", monto: 400 }),
      CONCEPTOS,
      AHORA,
    ).cambio!;
    expect(aplicarCambio(CONCEPTOS, agregado).map((c) => c.clave)).toEqual(["casa", "auto", "kiosco"]);
  });

  it("@HU-COB-16 CA3 el historial dice qué cambió, con los valores anteriores", () => {
    expect(
      textoDelCambio({
        tipo: "CAMBIAR",
        nombre: "Negocio",
        unidad: "POR_LOCAL",
        montoAnterior: 250,
        montoNuevo: 300,
      }),
    ).toBe("Negocio: de S/ 2.50 a S/ 3.00");
    expect(
      textoDelCambio({
        tipo: "AGREGAR",
        nombre: "Triciclo o carreta",
        unidad: "POR_VEHICULO",
        montoAnterior: null,
        montoNuevo: 50,
      }),
    ).toBe("Se agregó Triciclo o carreta: S/ 0.50 por vehículo");
  });

  it("@HU-COB-16 CA3 la vigente es la última que ya rige y lo demás está programado", () => {
    const v = (vigenciaDesde: string, creadaEn: string) => ({
      vigenciaDesde: new Date(vigenciaDesde),
      creadaEn: new Date(creadaEn),
    });
    const a = v("2026-01-05T05:00:00Z", "2025-12-20T12:00:00Z");
    const b = v("2026-04-06T05:00:00Z", "2026-03-28T12:00:00Z");
    const c = v("2026-10-05T05:00:00Z", "2026-09-27T12:00:00Z");
    const d = v("2026-10-05T05:00:00Z", "2026-09-27T12:30:00Z");
    const { vigente, programadas } = separarVersiones([d, b, a, c], AHORA);
    expect(vigente).toBe(b);
    expect(programadas).toEqual([c, d]);
    expect(separarVersiones([], AHORA)).toEqual({ vigente: null, programadas: [] });
  });

  it("@HU-COB-16 el nombre de un concepto se vuelve una clave estable", () => {
    expect(claveDe("Auto o camioneta")).toBe("auto-o-camioneta");
    expect(claveDe("  Ñandú  ")).toBe("nandu");
  });
});
