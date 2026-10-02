export {};

// Operación completa con teclado (HU-ACC-06): orden lógico, foco visible, nombre y estado de cada
// control y ninguna trampa de foco.

const tab = () => cy.press(Cypress.Keyboard.Keys.TAB);

type Foco = { fuera: boolean; texto: string; enDialogo: boolean };

/**
 * Qué tiene el foco; `fuera` cuando salió de la página. La aserción propia quita la exigencia por
 * defecto de cy.focused() de que exista un elemento enfocado.
 */
const conFoco = () =>
  cy
    .focused()
    .should(() => {})
    .then(($el): Foco => {
      const el = $el?.[0];
      if (!el || el.tagName === "BODY") return { fuera: true, texto: "", enDialogo: false };
      return { fuera: false, texto: el.textContent ?? "", enDialogo: !!el.closest("[role=dialog]") };
    });

/** Tabula como una persona hasta llegar al control que contiene el texto. */
function tabularHasta(texto: string, intentos = 30): void {
  if (intentos === 0) throw new Error(`No se llegó con Tab a «${texto}»`);
  tab();
  conFoco().then((foco) => {
    if (!foco.texto.includes(texto)) tabularHasta(texto, intentos - 1);
  });
}

describe("@HU-ACC-06 Teclado y lector de pantalla", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.guardarModo("normal");
  });

  it("@HU-ACC-06 CA1 el orden de tabulación sigue la página: saltar, barra superior, navegación y contenido", () => {
    cy.visit("/catalogo");
    tab();
    cy.focused().should("have.text", "Saltar al contenido");
    tab();
    cy.focused().should("contain.text", "Letra grande");
    tab();
    cy.focused().should("contain.text", "Pedir ayuda");
    ["Inicio", "Mi cuota", "Asambleas", "Incidentes", "Más", "Ver mis recibos"].forEach((texto) => {
      tab();
      cy.focused().should("contain.text", texto);
    });
  });

  it("@HU-ACC-06 CA1 el enlace para saltar lleva el foco al contenido", () => {
    cy.visit("/catalogo");
    tab();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.location("hash").should("eq", "#contenido");
    tab();
    cy.focused().should("contain.text", "Ver mis recibos");
  });

  it("@HU-ACC-06 CA1 todo control enfocable muestra un contorno de foco visible", () => {
    cy.visit("/catalogo");
    const revisados: string[] = [];
    for (let i = 0; i < 20; i++) {
      tab();
      cy.focused().then(($el) => {
        // Tras el último control, el foco sale de la página: no hay nada que revisar.
        if (!$el.length || $el[0].tagName === "BODY") return;
        const estilo = getComputedStyle($el[0]);
        expect(estilo.outlineStyle, `contorno de ${$el[0].outerHTML.slice(0, 80)}`).to.eq("solid");
        expect(parseFloat(estilo.outlineWidth)).to.be.gte(3);
        revisados.push($el.text());
      });
    }
    cy.wrap(revisados).its("length").should("be.gte", 15);
  });

  it("@HU-ACC-06 CA2 cada control anuncia nombre, función y estado", () => {
    cy.visit("/catalogo");
    cy.contains("button", "Letra grande").should("have.attr", "aria-pressed", "false");
    cy.get('nav[aria-label="Principal"]').should("exist");
    cy.get("input").each(($input) => {
      const id = $input.attr("id");
      // Cada campo tiene su etiqueta: un <label for> o la fila <label> que lo envuelve.
      if ($input.closest("label").length === 0) cy.get(`label[for="${id}"]`).should("have.length", 1);
    });
    cy.get("[aria-invalid=true]").should("have.attr", "aria-describedby");
    cy.get("fieldset legend").should("have.length.at.least", 2);
  });

  it("@HU-ACC-06 CA3 el diálogo guarda el foco mientras está abierto, Escape sale y el foco vuelve", () => {
    cy.visit("/catalogo");
    tabularHasta("Ver cómo se calcula");
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get("[role=dialog]").should("be.visible").and("have.attr", "aria-labelledby");
    conFoco().its("enDialogo").should("eq", true);
    for (let i = 0; i < 3; i++) {
      tab();
      conFoco().its("enDialogo").should("eq", true);
    }
    cy.press(Cypress.Keyboard.Keys.ESC);
    cy.get("[role=dialog]").should("not.exist");
    conFoco().its("texto").should("contain", "Ver cómo se calcula");
  });

  it("@HU-ACC-06 CA3 no hay trampas: tabulando se recorre la página entera y se sale de ella", () => {
    cy.visit("/catalogo/garita");
    const vistos: string[] = [];
    for (let i = 0; i < 9; i++) {
      tab();
      conFoco().then((foco) => vistos.push(foco.fuera ? "(fuera de la página)" : foco.texto.trim()));
    }
    cy.wrap(vistos).should("include", "Bitácora").and("include", "(fuera de la página)");
  });
});
