import { prepararPlacas } from "@/modulos/identidad/dominio/vehiculo";

describe("@HU-GAR-01 Placas de los vehículos al empadronar", () => {
  it("@HU-GAR-01 CA1 pide una placa por cada auto y cada moto que se declaró, y las guarda como se leen en la garita", () => {
    const { errores, vehiculos } = prepararPlacas(
      { autos: 2, motos: 1 },
      { autos: ["jlm314", " cdf 220 "], motos: ["1234a"] },
    );
    expect(errores).toEqual({});
    expect(vehiculos).toEqual([
      { tipo: "AUTO_O_CAMIONETA", placa: "JLM-314" },
      { tipo: "AUTO_O_CAMIONETA", placa: "CDF-220" },
      { tipo: "MOTO", placa: "1234A" },
    ]);
  });

  it("@HU-GAR-01 CA1 sin vehículos no pide placas", () => {
    expect(prepararPlacas({ autos: 0, motos: 0 }, { autos: [], motos: [] })).toEqual({ errores: {}, vehiculos: [] });
  });

  it("@HU-GAR-01 CA1 dice de qué vehículo falta la placa", () => {
    const { errores } = prepararPlacas({ autos: 2, motos: 1 }, { autos: ["JLM314"], motos: [" "] });
    expect(errores).toEqual({
      "placas.autos.1": "Escriba la placa del auto 2.",
      "placas.motos.0": "Escriba la placa de la moto 1.",
    });
  });

  it("@HU-GAR-01 CA1 rechaza una placa que no parece una placa y una repetida en la misma vivienda", () => {
    const { errores } = prepararPlacas(
      { autos: 3, motos: 1 },
      { autos: ["AB", "JLM-314", "jlm 314"], motos: ["JLM314"] },
    );
    expect(errores).toEqual({
      "placas.autos.0": "La placa tiene entre 5 y 7 letras o números, por ejemplo ABC-123.",
      "placas.autos.2": "Esta placa está repetida en esta vivienda.",
      "placas.motos.0": "Esta placa está repetida en esta vivienda.",
    });
  });

  it("@HU-GAR-01 las placas de más que la cantidad declarada se ignoran", () => {
    const { vehiculos } = prepararPlacas({ autos: 1, motos: 0 }, { autos: ["JLM314", "CDF220"], motos: ["X1234"] });
    expect(vehiculos).toEqual([{ tipo: "AUTO_O_CAMIONETA", placa: "JLM-314" }]);
  });
});
