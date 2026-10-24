import { cuotaParaAlertar } from "@/modulos/aportes/dominio/morosidad";

const LIMITE = new Date("2026-09-14T04:59:00Z"); // domingo 13 de setiembre, 11:59 p. m. en Lima
const dia = (dias: number) => new Date(LIMITE.getTime() + dias * 86_400_000);
const cuota = (id: string, fechaLimite: Date) => ({ id, fechaLimite });

describe("@HU-COB-05 CA1 a quién se le recuerda", () => {
  const impagas = [cuota("a", LIMITE), cuota("b", dia(7))];

  it("@HU-COB-05 CA1 con menos de 7 días de retraso todavía no se avisa", () => {
    expect(cuotaParaAlertar(impagas, dia(6), new Set())).toBeNull();
    expect(cuotaParaAlertar(impagas, dia(-1), new Set())).toBeNull();
  });

  it("@HU-COB-05 CA1 a los 7 días se avisa por la cuota más antigua que todavía se debe", () => {
    expect(cuotaParaAlertar(impagas, dia(7), new Set())?.id).toBe("a");
    expect(cuotaParaAlertar([...impagas].reverse(), dia(30), new Set())?.id).toBe("a");
  });

  it("@HU-COB-05 CA3 una sola alerta por cuota: si ya se avisó de esa, no se repite", () => {
    expect(cuotaParaAlertar(impagas, dia(10), new Set(["a"]))).toBeNull();
    // Pagada la primera, la siguiente cuota tiene su propio aviso cuando cumple sus 7 días.
    expect(cuotaParaAlertar([cuota("b", dia(7))], dia(14), new Set(["a"]))?.id).toBe("b");
    expect(cuotaParaAlertar([cuota("b", dia(7))], dia(13), new Set(["a"]))).toBeNull();
  });

  it("@HU-COB-05 CA3 desde las 8 semanas ya no es un recordatorio: es la suspensión (HU-COB-06)", () => {
    expect(cuotaParaAlertar(impagas, dia(55), new Set())?.id).toBe("a");
    expect(cuotaParaAlertar(impagas, dia(56), new Set())).toBeNull();
  });

  it("@HU-COB-05 una casa sin deudas no recibe nada", () => {
    expect(cuotaParaAlertar([], dia(30), new Set())).toBeNull();
  });
});
