import { proyectarQuorum, textoDelQuorum } from "@/modulos/asambleas/dominio/quorum";

describe("@HU-ASA-04 Quórum proyectado", () => {
  const base = { padronTotal: 120, requerido: 61 };

  it("@HU-ASA-04 CA1 cuenta digitales y asistidas frente al padrón total", () => {
    const q = proyectarQuorum({ ...base, digital: 44, asistida: 4 });
    expect(q.confirmados).toBe(48);
    expect(q.porcentaje).toBe(40);
  });

  it("@HU-ASA-04 CA2 dice cuántas casas faltan cuando no llega al umbral", () => {
    const q = proyectarQuorum({ ...base, digital: 44, asistida: 4 });
    expect(q.alcanza).toBe(false);
    expect(q.faltan).toBe(13);
    expect(textoDelQuorum(q)).toBe("Faltan 13 casas para el mínimo (61).");
  });

  it("@HU-ASA-04 CA2 indica que supera el umbral legal al llegar al mínimo", () => {
    const q = proyectarQuorum({ ...base, digital: 55, asistida: 6 });
    expect(q.alcanza).toBe(true);
    expect(q.faltan).toBe(0);
    expect(textoDelQuorum(q)).toBe("Se llegó al mínimo de 61 casas.");
  });

  it("@HU-ASA-04 CA2 una sola casa que falta se dice en singular", () => {
    expect(textoDelQuorum(proyectarQuorum({ ...base, digital: 60, asistida: 0 }))).toBe(
      "Falta 1 casa para el mínimo (61).",
    );
  });

  it("@HU-ASA-04 el padrón vacío no divide por cero", () => {
    const q = proyectarQuorum({ padronTotal: 0, requerido: 1, digital: 0, asistida: 0 });
    expect(q.porcentaje).toBe(0);
    expect(q.alcanza).toBe(false);
  });
});
