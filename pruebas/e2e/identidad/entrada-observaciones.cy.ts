export {};

// Observaciones del checklist de flujos por rol sobre la entrada sin sesión (VEC-07 y VEC-08).

describe("@HU-GAR-02 @HU-QUE-09 Entrada sin sesión: política y seguimiento", () => {
  it("@HU-GAR-02 CA2 [VEC-07] la política pública tiene «Volver» y regresa a «Antes de empezar»", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.visit("/entrar/privacidad");
    cy.contains("a", "Leer la política de privacidad completa").click();
    cy.get("h1").should("have.text", "Política de privacidad");
    cy.contains("a", "Volver a «Antes de empezar»").should("have.attr", "href", "/entrar/privacidad");
    cy.revisarAccesibilidad("politica-publica-normal");
    cy.contains("a", "Volver a «Antes de empezar»").click();
    cy.get("h1").should("have.text", "Cómo cuidamos sus datos");
  });

  it("@HU-QUE-09 CA1 [VEC-08] la entrada ofrece buscar un reporte con el código, sin entrar", () => {
    cy.clearCookies();
    cy.visit("/entrar");
    cy.contains("a", "Seguir un reporte con mi código").should("have.attr", "href", "/seguimiento");
    cy.revisarAccesibilidad("entrada-con-seguimiento-normal");
    cy.contains("a", "Seguir un reporte con mi código").click();
    cy.get("h1").should("have.text", "Buscar con mi código");
    cy.contains("No necesita entrar a su cuenta").should("exist");
  });
});
