const TAMANOS = [
  { nombre: "telefono", ancho: 360, alto: 800 },
  { nombre: "escritorio", ancho: 1280, alto: 800 },
];

describe("@HU-INFRA Página de entrada", () => {
  TAMANOS.forEach(({ nombre, ancho, alto }) => {
    it(`@HU-INFRA carga en ${nombre} (${ancho}×${alto}) sin violaciones axe`, () => {
      cy.viewport(ancho, alto);
      cy.visit("/entrar");
      cy.get("html").should("have.attr", "lang", "es");
      cy.get("h1").should("have.length", 1).and("have.text", "Entrar a su cuenta");
      cy.get("main#contenido").should("exist");
      cy.revisarAccesibilidad(`inicio-normal-${nombre}`);
    });
  });

  it("@HU-INFRA el primer Tab lleva al enlace para saltar al contenido", () => {
    cy.visit("/entrar");
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.focused()
      .should("have.attr", "href", "#contenido")
      .and("be.visible")
      .and("have.text", "Saltar al contenido");
  });
});
