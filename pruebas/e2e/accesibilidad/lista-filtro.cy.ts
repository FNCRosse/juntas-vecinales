export {};

// R-11: los filtros van detrás de un solo botón "Filtrar" y las listas muestran 5 elementos en vista
// normal y 3 en vista grande, con "Ver más" (HU-ACC-09). Se comprueba en el catálogo.

const elementos = () => cy.get('ul[aria-label="Avisos de ejemplo"] > li:visible');

describe("@HU-ACC-09 Filtrar y Ver más", () => {
  beforeEach(() => cy.viewport(360, 800));

  [
    { modo: "normal", visibles: 5, sobran: 2 },
    { modo: "senior", visibles: 3, sobran: 4 },
  ].forEach(({ modo, visibles, sobran }) => {
    it(`@HU-ACC-09 CA2 en vista ${modo} la lista muestra ${visibles} y "Ver más (${sobran})" la despliega`, () => {
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/catalogo");
      cy.esperarHidratacion("Filtrar");
      elementos().should("have.length", visibles);
      cy.contains("button", `Ver más (${sobran})`).should("have.attr", "aria-expanded", "false").click();
      elementos().should("have.length", 7);
      cy.contains("button", "Ver menos").should("have.attr", "aria-expanded", "true").click();
      elementos().should("have.length", visibles);
    });
  });

  it("@HU-ACC-09 CA2 'Filtrar' abre una hoja con las opciones, Escape la cierra y el foco vuelve al botón", () => {
    cy.guardarModo("normal");
    cy.visit("/catalogo");
    cy.esperarHidratacion("Filtrar").click();
    cy.get("[role=dialog]").within(() => {
      cy.contains("h2", "Mostrar avisos de");
      cy.contains("a", "Todos los avisos").should("have.attr", "aria-current", "true");
      cy.contains("a", "Pagos");
    });
    cy.revisarAccesibilidad("filtrar-hoja-normal-telefono");
    cy.get("body").type("{esc}");
    cy.get("[role=dialog]").should("not.exist");
    cy.focused().should("contain.text", "Filtrar");
  });
});
