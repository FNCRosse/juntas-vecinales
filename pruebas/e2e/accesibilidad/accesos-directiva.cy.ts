export {};

// Observaciones del checklist sobre accesos de la directiva: Alertas (DIR-06), Recaudación (DIR-20) y Poderes (DIR-37).

function entrarComoMarta() {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
  cy.request("POST", "/api/auth/politica", { acepto: true });
}

describe("@HU-GAR-19 @HU-COB-13 @HU-ASA-07 Accesos visibles de la directiva", () => {
  it("@HU-GAR-19 [DIR-06] el resumen lleva a Alertas con un botón visible", () => {
    entrarComoMarta();
    cy.visit("/directiva");
    cy.contains("a", "Ver alertas").should("have.attr", "href", "/directiva/alertas").click();
    cy.get("h1").should("contain.text", "Alertas");
  });

  it("@HU-COB-13 [DIR-20] Cobros lleva a la Recaudación", () => {
    entrarComoMarta();
    cy.visit("/directiva/cobros");
    cy.contains("a", "Recaudación del mes")
      .should("have.attr", "href", "/directiva/cobros/recaudacion")
      .click();
    cy.get("h1").should("contain.text", "Recaudación");
    cy.revisarAccesibilidad("recaudacion-desde-cobros-normal");
  });

  it("@HU-ASA-07 [DIR-37] Poderes dice que solo se validan el día de la asamblea", () => {
    entrarComoMarta();
    cy.visit("/directiva/asambleas/poderes");
    cy.contains("Los poderes se validan solo el día de la asamblea").should("exist");
    cy.revisarAccesibilidad("poderes-aviso-dia-normal");
  });
});
