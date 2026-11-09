import { coincideConBusqueda } from "@/modulos/identidad/dominio/garita";

const fila = {
  quien: "Julio Mendoza",
  placa: "JLM-314",
  vivienda: "Mz. B, lote 4",
  descripcion: "Vecino · Entró por la reja",
};

describe("@HU-GAR-08 [VIG-15] Buscar en la bitácora por vecino, placa o vivienda", () => {
  it("@HU-GAR-08 sin texto muestra todo", () => {
    expect(coincideConBusqueda(fila, "")).toBe(true);
    expect(coincideConBusqueda(fila, "   ")).toBe(true);
  });

  it("@HU-GAR-08 busca por nombre sin importar mayúsculas ni tildes", () => {
    expect(coincideConBusqueda(fila, "julio")).toBe(true);
    expect(coincideConBusqueda({ ...fila, quien: "María Pérez" }, "maria perez")).toBe(true);
  });

  it("@HU-GAR-08 busca por placa con o sin guion, y por lote", () => {
    expect(coincideConBusqueda(fila, "jlm314")).toBe(true);
    expect(coincideConBusqueda(fila, "JLM-314")).toBe(true);
    expect(coincideConBusqueda(fila, "lote 4")).toBe(true);
  });

  it("@HU-GAR-08 todas las palabras deben aparecer", () => {
    expect(coincideConBusqueda(fila, "julio lote 4")).toBe(true);
    expect(coincideConBusqueda(fila, "julio lote 9")).toBe(false);
    expect(coincideConBusqueda({ ...fila, placa: null }, "jlm")).toBe(false);
  });
});
