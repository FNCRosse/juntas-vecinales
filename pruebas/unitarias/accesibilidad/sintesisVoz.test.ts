import { PerfilAccesibilidad } from "@/modulos/accesibilidad/dominio/perfilAccesibilidad";
import { elegirVoz, textoParaLeer } from "@/modulos/accesibilidad/dominio/sintesisVoz";

describe("@HU-ACC-02 Lectura en voz alta", () => {
  it("@HU-ACC-02 CA1 activar la lectura en voz alta no cambia el modo Senior y viceversa", () => {
    const perfil = PerfilAccesibilidad.porDefecto("usuario-1");
    perfil.activarSintesisVoz();
    expect(perfil.aDatos()).toMatchObject({ sintesisVozActiva: true, modoSeniorActivo: false });
    perfil.activarModoSenior();
    perfil.desactivarModoSenior();
    expect(perfil.aDatos().sintesisVozActiva).toBe(true);
    perfil.desactivarSintesisVoz();
    expect(perfil.aDatos().sintesisVozActiva).toBe(false);
  });

  it("@HU-ACC-02 CA2 elige la voz es-PE; si no hay, otra en español; sin voz en español no hay botón", () => {
    const voces = [
      { lang: "en-US", name: "Ana" },
      { lang: "es-ES", name: "Lucía" },
      { lang: "es_PE", name: "Camila" },
    ];
    expect(elegirVoz(voces)?.name).toBe("Camila");
    expect(elegirVoz(voces.slice(0, 2))?.name).toBe("Lucía");
    expect(elegirVoz([{ lang: "es", name: "Mía" }])?.name).toBe("Mía");
    expect(elegirVoz([{ lang: "en-US", name: "Ana" }])).toBeNull();
    expect(elegirVoz([])).toBeNull();
  });

  it("@HU-ACC-02 CA2 lee primero la urgencia y luego el título y el mensaje, con pausas", () => {
    expect(textoParaLeer({ titulo: "Corte de agua", cuerpo: "Mañana de 9 a 13.", urgencia: "URGENTE" })).toBe(
      "Urgente. Corte de agua. Mañana de 9 a 13.",
    );
    expect(textoParaLeer({ titulo: "Reunión", cuerpo: "El sábado.", urgencia: "INFORMATIVO" })).toBe(
      "Reunión. El sábado.",
    );
  });
});
