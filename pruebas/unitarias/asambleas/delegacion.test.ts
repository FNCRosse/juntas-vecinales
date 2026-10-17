import {
  excedeLimite,
  MAXIMO_REPRESENTACIONES,
  numeroDeConstancia,
  prepararDelegacion,
} from "@/modulos/asambleas/dominio/delegacion";

describe("@HU-ASA-06 Delegar el voto en un apoderado", () => {
  const valida = { nombre: "  Rosa Huamán ", dni: "08123456", condicion: "FAMILIAR" as const };

  it("@HU-ASA-06 CA1 limpia el nombre y acepta familiar, vecino o externo", () => {
    for (const condicion of ["FAMILIAR", "VECINO", "EXTERNO"] as const) {
      const { errores, delegacion } = prepararDelegacion({ ...valida, condicion });
      expect(errores).toEqual({});
      expect(delegacion.nombre).toBe("Rosa Huamán");
    }
  });

  it("@HU-ASA-06 CA1 pide nombre, un DNI de 8 cifras y la condición, con mensajes llanos", () => {
    const { errores } = prepararDelegacion({ nombre: " ", dni: "123", condicion: "OTRA" as never });
    expect(errores.nombre).toMatch(/nombre/i);
    expect(errores.dni).toMatch(/8 cifras/);
    expect(errores.condicion).toMatch(/quién es/i);
  });

  it("@HU-ASA-06 CA1 el DNI admite espacios alrededor pero no letras", () => {
    expect(prepararDelegacion({ ...valida, dni: " 08123456 " }).errores).toEqual({});
    expect(prepararDelegacion({ ...valida, dni: "0812345A" }).errores.dni).toMatch(/8 cifras/);
  });

  it("@HU-ASA-06 CA3 el límite de representaciones es 2 (valor del prototipo)", () => {
    expect(MAXIMO_REPRESENTACIONES).toBe(2);
    expect(excedeLimite(1)).toBe(false);
    expect(excedeLimite(2)).toBe(true);
    expect(excedeLimite(3)).toBe(true);
  });

  it("@HU-ASA-06 CA2 la constancia lleva un número correlativo de cuatro cifras", () => {
    expect(numeroDeConstancia(31)).toBe("D-0031");
    expect(numeroDeConstancia(1)).toBe("D-0001");
    expect(numeroDeConstancia(12345)).toBe("D-12345");
  });
});
