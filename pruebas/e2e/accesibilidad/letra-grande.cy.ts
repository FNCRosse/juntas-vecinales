export {};

// "Letra grande": se aplica al instante, se guarda en el servidor y sigue activa al recargar (ADR-004).

describe("@HU-ACC-01 Letra grande persiste en el servidor", () => {
  beforeEach(() => cy.clearCookies());

  it("@HU-ACC-01 CA1 activarla aplica el modo Senior y se mantiene al recargar y en una visita nueva", () => {
    cy.intercept("PUT", "/api/accesibilidad/perfil").as("guardar");
    cy.visit("/catalogo");
    cy.get("html").should("not.have.attr", "data-mode");
    cy.esperarHidratacion("Letra grande").should("have.attr", "aria-pressed", "false").click();

    cy.get("html").should("have.attr", "data-mode", "senior");
    cy.wait("@guardar").its("response.statusCode").should("eq", 200);
    cy.contains("button", "Letra grande").should("have.attr", "aria-pressed", "true");

    cy.reload();
    cy.get("html").should("have.attr", "data-mode", "senior");
    cy.contains("button", "Letra grande").should("have.attr", "aria-pressed", "true");
    // El texto de cuerpo sube a 22 px por token (HU-ACC-01 CA2).
    cy.get("main p").first().should("have.css", "font-size", "22px");

    cy.visit("/");
    cy.get("html").should("have.attr", "data-mode", "senior");

    cy.contains("button", "Letra grande").click();
    cy.get("html").should("not.have.attr", "data-mode");
    cy.reload();
    cy.get("html").should("not.have.attr", "data-mode");
    cy.get("main p").first().should("have.css", "font-size", "18px");
  });

  it("@HU-ACC-01 si no se pudo guardar, el modo se mantiene en este teléfono y se avisa", () => {
    cy.intercept("PUT", "/api/accesibilidad/perfil", { statusCode: 500, body: {} });
    cy.visit("/catalogo");
    cy.esperarHidratacion("Letra grande").click();
    cy.get("html").should("have.attr", "data-mode", "senior");
    cy.contains("[role=status]", "No pudimos guardar su preferencia. Se mantendrá en este teléfono.");
    cy.reload();
    cy.get("html").should("have.attr", "data-mode", "senior");
    cy.revisarAccesibilidad("letra-grande-sin-guardar");
  });
});
