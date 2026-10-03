import { normalizarCodigo, pasosDelAvance, superaLimite } from "@/modulos/incidencias/dominio/seguimiento";

const FECHA = "27 de septiembre de 2026 a las 10:24 a. m.";
const estados = (estado: Parameters<typeof pasosDelAvance>[0]) =>
  pasosDelAvance(estado, FECHA).map((p) => `${p.titulo}: ${p.estado}`);

describe("@HU-QUE-09 Seguimiento por código", () => {
  it("@HU-QUE-09 CA1 acepta el código con espacios o en minúsculas", () => {
    expect(normalizarCodigo(" q-2026-00142-k7qm ")).toBe("Q-2026-00142-K7QM");
  });

  it("@HU-QUE-09 CA1 muestra cada estado en palabras: recibido, en revisión, resuelto, derivado", () => {
    expect(estados("RECIBIDO")).toEqual([
      "1. Recibido: hecho",
      "2. En revisión: ahora",
      "3. Resuelto o derivado: pendiente",
    ]);
    expect(pasosDelAvance("RECIBIDO", FECHA)[0].texto).toBe(FECHA);
    expect(estados("EN_REVISION")[1]).toBe("2. En revisión: ahora");
    expect(estados("RESUELTO")).toEqual([
      "1. Recibido: hecho",
      "2. En revisión: hecho",
      "3. Resuelto: hecho",
    ]);
    expect(estados("DERIVADO_ENTIDAD_EXTERNA")[2]).toBe("3. Derivado: hecho");
    expect(estados("RECHAZADO")).toEqual(["1. Recibido: hecho", "2. Revisado: no procede: hecho"]);
  });

  it("@HU-QUE-09 limita a 10 consultas por conexión en la ventana", () => {
    expect(superaLimite(9)).toBe(false);
    expect(superaLimite(10)).toBe(true);
  });
});
