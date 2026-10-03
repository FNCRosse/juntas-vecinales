import {
  aplicarAccion,
  debeOfrecerse,
  estadoEnTexto,
  MAXIMO_PASOS,
} from "@/modulos/accesibilidad/dominio/onboardingGuiado";
import { RECORRIDOS } from "@/modulos/accesibilidad/dominio/recorridos";

describe("@HU-ACC-10 Tutorial guiado por sección", () => {
  it("@HU-ACC-10 CA1 cada recorrido tiene cinco pasos como máximo, cada uno con una sola acción", () => {
    for (const { pasos } of Object.values(RECORRIDOS)) {
      expect(pasos.length).toBeGreaterThan(0);
      expect(pasos.length).toBeLessThanOrEqual(MAXIMO_PASOS);
      for (const paso of pasos) expect(paso.accion).toBeTruthy();
    }
  });

  it("@HU-ACC-10 CA2 se puede avanzar, pausar, omitir, completar o volver a activar", () => {
    expect(aplicarAccion("avanzar", 4, 2)).toEqual({ estado: "EN_CURSO", paso: 2 });
    expect(aplicarAccion("avanzar", 4, 9)).toEqual({ estado: "EN_CURSO", paso: 3 });
    expect(aplicarAccion("pausar", 4, 1)).toEqual({ estado: "PAUSADA", paso: 1 });
    expect(aplicarAccion("omitir", 4, 2)).toEqual({ estado: "OMITIDA", paso: 0 });
    expect(aplicarAccion("completar", 4)).toEqual({ estado: "COMPLETADA", paso: 3 });
    expect(aplicarAccion("reactivar", 4, 3)).toEqual({ estado: "EN_CURSO", paso: 0 });
    expect(aplicarAccion("avanzar", 4, -1.5)).toEqual({ estado: "EN_CURSO", paso: 0 });
  });

  it("@HU-ACC-10 CA3 se ofrece la primera vez y en pausa; vista u omitida, ya no", () => {
    expect(
      [null, "PAUSADA", "EN_CURSO", "OMITIDA", "COMPLETADA"].map((e) => debeOfrecerse(e as never)),
    ).toEqual([true, true, false, false, false]);
    expect(estadoEnTexto(null, 0, 4)).toBe("Todavía no la ve");
    expect(estadoEnTexto("PAUSADA", 1, 4)).toBe("La dejó en el paso 2 de 4");
    expect(estadoEnTexto("COMPLETADA", 3, 4)).toBe("Ya la vio");
    expect(estadoEnTexto("OMITIDA", 0, 4)).toBe("La saltó; puede verla cuando quiera");
  });
});
