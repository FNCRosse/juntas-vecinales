export {};

// Auditoría global (ADM-AUD-01). Una vecina nueva deja dos acciones: la administradora la empadrona y
// ella acepta la política.

describe("@HU-GAR-26 Auditoría global", () => {
  it("@HU-GAR-26 CA1 CA2 CA3 une las acciones de todos los módulos y filtra por módulo y responsable", () => {
    cy.entrarComoVecinaNueva("Rita Gómez Sol");
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
    cy.visit("/administracion");
    cy.contains("a", "Auditoría").click();
    cy.get("h1").should("have.text", "Auditoría");
    cy.contains('ul[aria-label="Acciones registradas"] > li', "Empadronó una vivienda")
      .should("contain.text", "Ana Flores")
      .and("contain.text", "Solo lectura");
    cy.revisarAccesibilidad("auditoria-normal");

    cy.get('nav[aria-label="Filtrar por módulo"]').contains("a", "Privacidad").click();
    cy.get("#filtro-responsable").select("Rita Gómez Sol");
    cy.contains("button", "Filtrar").click();
    cy.location("search").should("contain", "modulo=Privacidad");
    cy.get('ul[aria-label="Acciones registradas"] > li')
      .should("have.length", 1)
      .and("contain.text", "Aceptó la política de privacidad");
    cy.contains('[role="status"]', "1 registro").should("exist");
    cy.revisarAccesibilidad("auditoria-filtrada-normal");
  });

  it("@HU-GAR-26 en modo Senior la auditoría cumple WCAG 2.2 AA", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/administracion/auditoria");
    cy.get("h1").should("have.text", "Auditoría");
    cy.revisarAccesibilidad("auditoria-senior-360");
    cy.guardarModo("normal");
  });
});
