import { admiteContingencia, prepararContingencia } from "@/modulos/asambleas/dominio/contingencia";

const AHORA = new Date("2026-12-14T02:00:00Z");

describe("@HU-ASA-05 Contingencia por falta de quórum", () => {
  it("@HU-ASA-05 CA1 acepta reprogramar con una fecha nueva a futuro", () => {
    const errores = prepararContingencia(
      { decision: "REPROGRAMAR", nuevaFechaHora: new Date("2026-12-21T23:00:00Z") },
      AHORA,
    );
    expect(errores).toEqual({});
  });

  it("@HU-ASA-05 CA1 acepta convertir en sesión informativa sin pedir fecha", () => {
    expect(prepararContingencia({ decision: "INFORMATIVA", nuevaFechaHora: null }, AHORA)).toEqual({});
  });

  it("@HU-ASA-05 CA2 reprogramar exige la nueva fecha", () => {
    const errores = prepararContingencia({ decision: "REPROGRAMAR", nuevaFechaHora: null }, AHORA);
    expect(errores.nuevaFechaHora).toMatch(/nueva fecha/i);
  });

  it("@HU-ASA-05 CA2 la nueva fecha no puede ser pasada", () => {
    const errores = prepararContingencia(
      { decision: "REPROGRAMAR", nuevaFechaHora: new Date("2026-12-01T23:00:00Z") },
      AHORA,
    );
    expect(errores.nuevaFechaHora).toMatch(/posterior/i);
  });

  it("@HU-ASA-05 CA1 rechaza una decisión desconocida", () => {
    const errores = prepararContingencia({ decision: "OTRA" as never, nuevaFechaHora: null }, AHORA);
    expect(errores.decision).toMatch(/reprograma/i);
  });

  it("@HU-ASA-05 solo admite la contingencia una asamblea vigente sin quórum después del corte", () => {
    const corte = new Date("2026-12-14T01:00:00Z");
    expect(
      admiteContingencia({ estado: "PUBLICADA", alcanza: false, confirmacionesHasta: corte }, AHORA),
    ).toBe("si");
    expect(
      admiteContingencia({ estado: "PUBLICADA", alcanza: true, confirmacionesHasta: corte }, AHORA),
    ).toBe("alcanza");
    expect(
      admiteContingencia(
        { estado: "PUBLICADA", alcanza: false, confirmacionesHasta: new Date("2026-12-15T01:00:00Z") },
        AHORA,
      ),
    ).toBe("antes_del_corte");
    expect(
      admiteContingencia({ estado: "INFORMATIVA", alcanza: false, confirmacionesHasta: corte }, AHORA),
    ).toBe("estado");
    expect(admiteContingencia({ estado: "CERRADA", alcanza: false, confirmacionesHasta: corte }, AHORA)).toBe(
      "estado",
    );
  });
});
