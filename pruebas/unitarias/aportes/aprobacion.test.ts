import { aplicarAbono } from "@/modulos/aportes/dominio/cuota";
import {
  clasificarMorosidad,
  diasDeRetraso,
  SEMANAS_PARA_CRITICO,
} from "@/modulos/aportes/dominio/morosidad";

describe("@HU-COB-09 abono a una cuota", () => {
  it("@HU-COB-09 CA2 si el abono cubre todo lo que falta, la cuota queda pagada y sin saldo", () => {
    expect(aplicarAbono(500, 500, "PENDIENTE")).toEqual({ saldo: 0, estado: "PAGADA" });
    expect(aplicarAbono(500, 500, "VENCIDA")).toEqual({ saldo: 0, estado: "PAGADA" });
  });

  it("@HU-COB-09 CA3 si el abono es parcial, queda el saldo que falta y la cuota sigue como estaba", () => {
    expect(aplicarAbono(500, 200, "PENDIENTE")).toEqual({ saldo: 300, estado: "PENDIENTE" });
    expect(aplicarAbono(500, 200, "VENCIDA")).toEqual({ saldo: 300, estado: "VENCIDA" });
  });

  it("@HU-COB-09 un abono nunca deja saldo negativo ni cambia una cuota en discrepancia", () => {
    expect(aplicarAbono(300, 500, "PENDIENTE")).toEqual({ saldo: 0, estado: "PAGADA" });
    expect(aplicarAbono(500, 200, "EN_DISCREPANCIA")).toEqual({ saldo: 300, estado: "EN_DISCREPANCIA" });
  });
});

describe("@HU-COB-09 retraso y morosidad", () => {
  const AHORA = new Date("2026-10-26T15:00:00Z");
  const cuota = (limite: string) => ({ fechaLimite: new Date(limite) });

  it("@HU-COB-09 el retraso se cuenta en días desde la fecha límite de la cuota impaga más antigua", () => {
    expect(diasDeRetraso([], AHORA)).toBe(0);
    expect(diasDeRetraso([cuota("2026-10-26T04:59:59Z")], AHORA)).toBe(0);
    expect(diasDeRetraso([cuota("2026-10-19T04:59:59Z"), cuota("2026-10-05T04:59:59Z")], AHORA)).toBe(21);
    // Una cuota que todavía no vence no cuenta como retraso.
    expect(diasDeRetraso([cuota("2026-11-02T04:59:59Z")], AHORA)).toBe(0);
  });

  it("@HU-COB-09 sin retraso, al día; desde 7 días, preventivo; desde 8 semanas, crítico", () => {
    expect(SEMANAS_PARA_CRITICO).toBe(8);
    expect(clasificarMorosidad([], AHORA)).toBe("SOLVENTE");
    expect(clasificarMorosidad([cuota("2026-10-20T04:59:59Z")], AHORA)).toBe("SOLVENTE");
    expect(clasificarMorosidad([cuota("2026-10-19T04:59:59Z")], AHORA)).toBe("MOROSO_PREVENTIVO");
    expect(clasificarMorosidad([cuota("2026-09-01T04:59:59Z")], AHORA)).toBe("MOROSO_PREVENTIVO");
    expect(clasificarMorosidad([cuota("2026-08-30T04:59:59Z")], AHORA)).toBe("MOROSO_CRITICO");
  });
});
