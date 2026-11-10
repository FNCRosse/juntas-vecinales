export {};

// Observaciones de la prueba en producción sobre la navegación: Noticias en Más del vecino (VEC-51) y la barra del
// administrador sin un "Más" que repite lo que ya está a la vista en el escritorio (ADM-23).

const CLAVE = "clave-de-prueba";

describe("@HU-ACC-09 Navegación: lo que faltaba y lo que sobraba", () => {
  it("@HU-ACC-09 [VEC-51] Noticias de la junta se abre desde Más", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: CLAVE });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.viewport(360, 800);
    cy.guardarModo("normal");
    cy.visit("/mas");
    cy.contains("a", "Noticias de la junta").should("have.attr", "href", "/noticias").click();
    cy.location("pathname").should("eq", "/noticias");
    cy.visit("/mas");
    cy.revisarAccesibilidad("mas-vecino-normal-360");
  });

  it("@HU-ACC-09 [ADM-23] en el escritorio la barra del administrador no repite Más; en el teléfono sí lo tiene", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: CLAVE });
    cy.viewport(1280, 800);
    cy.visit("/administracion");
    cy.get('nav[aria-label="Principal"]').contains("a", "Privacidad").should("be.visible");
    cy.get('nav[aria-label="Principal"]').contains("a", "Más").should("not.be.visible");
    cy.contains("header button", "Cerrar sesión").should("be.visible");
    cy.revisarAccesibilidad("panel-administracion-escritorio");
    cy.viewport(360, 800);
    cy.get('nav[aria-label="Principal"]').contains("a", "Más").should("be.visible");
  });
});
