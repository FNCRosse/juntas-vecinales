export {};

// Lectura en voz alta de las noticias (VEC-AYU-03, VEC-TRA-04). Chrome sin pantalla no trae voces
// instaladas: se reemplaza la síntesis por una que anota lo que se le pide leer.

const sufijo = String(Date.now()).slice(-6);
const TITULO = `Reunión de limpieza ${sufijo}`;

type Anotada = { texto: string; lang: string };
declare global {
  interface Window {
    __leidas: Anotada[];
    __pausas: string[];
  }
}

function conVoces(voces: { lang: string; name: string }[]) {
  return {
    onBeforeLoad(ventana: Window) {
      ventana.__leidas = [];
      ventana.__pausas = [];
      Object.defineProperty(ventana, "SpeechSynthesisUtterance", {
        configurable: true,
        value: class {
          lang = "";
          voice: unknown = null;
          onend: (() => void) | null = null;
          onerror: (() => void) | null = null;
          constructor(public text: string) {}
        },
      });
      Object.defineProperty(ventana, "speechSynthesis", {
        configurable: true,
        value: {
          getVoices: () => voces,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          speak: (dicho: { text: string; lang: string }) =>
            ventana.__leidas.push({ texto: dicho.text, lang: dicho.lang }),
          pause: () => ventana.__pausas.push("pausa"),
          resume: () => ventana.__pausas.push("sigue"),
          cancel: () => ventana.__pausas.push("corte"),
        },
      });
    },
  };
}

const VOZ_PERUANA = [{ lang: "es-PE", name: "Camila" }];

describe("@HU-ACC-02 Escuchar en voz alta los comunicados del feed", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.request("POST", "/api/transparencia/comunicados", {
      titulo: TITULO,
      cuerpo: "El sábado a las 8 de la mañana, en el parque.",
      urgencia: "URGENTE",
      idOperacion: crypto.randomUUID(),
    });
  });

  it("@HU-ACC-02 CA1 se activa desde Ayuda y accesibilidad y se conserva al volver", () => {
    cy.request("PUT", "/api/accesibilidad/perfil", { sintesisVozActiva: false });
    cy.viewport(360, 800);
    cy.visit("/mas/ayuda-y-accesibilidad", conVoces(VOZ_PERUANA));
    cy.get("h1").should("have.text", "Ayuda y accesibilidad");
    cy.contains("[role='switch']", "Leer en voz alta las noticias").as("interruptor");
    cy.get("@interruptor").should("have.attr", "aria-checked", "false");
    cy.revisarAccesibilidad("ayuda-voz-360");
    cy.esperarHidratacion("Letra grande");
    cy.get("@interruptor").click();
    cy.get("@interruptor").should("have.attr", "aria-checked", "true").and("contain.text", "Sí");
    cy.visit("/mas/ayuda-y-accesibilidad", conVoces(VOZ_PERUANA));
    cy.contains("[role='switch']", "Leer en voz alta las noticias").should(
      "have.attr",
      "aria-checked",
      "true",
    );
  });

  it("@HU-ACC-02 CA2 CA3 en modo Senior cada noticia tiene Escuchar, Pausar y Detener de 64 px", () => {
    cy.request("PUT", "/api/accesibilidad/perfil", { sintesisVozActiva: true });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/noticias", conVoces(VOZ_PERUANA));
    cy.contains("article", TITULO).as("noticia");
    cy.get("@noticia")
      .contains("button", "Escuchar")
      .should("be.visible")
      .invoke("outerHeight")
      .should("be.gte", 64);
    cy.revisarAccesibilidad("noticias-voz-senior-360");

    cy.get("@noticia").contains("button", "Escuchar").click();
    cy.window()
      .its("__leidas")
      .should("deep.equal", [
        { texto: `Urgente. ${TITULO}. El sábado a las 8 de la mañana, en el parque.`, lang: "es-PE" },
      ]);
    cy.get("@noticia").contains("[role='status']", "Leyendo").should("exist");
    cy.get("@noticia").contains("button", "Pausar").invoke("outerHeight").should("be.gte", 64);
    cy.get("@noticia").contains("button", "Detener").invoke("outerHeight").should("be.gte", 64);
    cy.revisarAccesibilidad("noticias-voz-leyendo-senior-360");

    cy.get("@noticia").contains("button", "Pausar").click();
    cy.get("@noticia").contains("[role='status']", "En pausa").should("exist");
    cy.get("@noticia").contains("button", "Continuar").click();
    cy.get("@noticia").contains("button", "Detener").click();
    cy.get("@noticia").contains("button", "Escuchar").should("exist");
    cy.window().its("__pausas").should("include.members", ["pausa", "sigue", "corte"]);
  });

  it("@HU-ACC-02 CA2 sin voz en español el botón no aparece y se explica por qué", () => {
    cy.request("PUT", "/api/accesibilidad/perfil", { sintesisVozActiva: true });
    cy.viewport(360, 800);
    cy.visit("/noticias", conVoces([{ lang: "en-US", name: "Ana" }]));
    cy.contains("article", TITULO).should("exist");
    cy.contains("button", "Escuchar").should("not.exist");
    cy.contains("[role='status']", "Este teléfono no tiene una voz en español").should("exist");
    cy.revisarAccesibilidad("noticias-sin-voz-360");
  });

  it("@HU-ACC-02 CA2 con la lectura apagada no se muestra ningún botón de escuchar", () => {
    cy.request("PUT", "/api/accesibilidad/perfil", { sintesisVozActiva: false });
    cy.visit("/noticias", conVoces(VOZ_PERUANA));
    cy.contains("article", TITULO).should("exist");
    cy.contains("button", "Escuchar").should("not.exist");
  });
});
