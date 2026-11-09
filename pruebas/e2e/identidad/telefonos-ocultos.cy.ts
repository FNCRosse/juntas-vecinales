export {};

// Observación ADM-06 del checklist: la ficha no muestra el número completo (privacidad). DIR-50 y MED-18 se prueban en
// accesibilidad/ayuda.cy.ts, donde nace el pedido de ayuda.

describe("@HU-GAR-04 Teléfonos ocultos", () => {
  it("@HU-GAR-04 [ADM-06] la ficha de la vivienda muestra solo el final del WhatsApp", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
    cy.visit("/administracion/padron");
    cy.get('a[href^="/administracion/padron/"]').not('[href$="/empadronar"]').first().click();
    cy.contains("WhatsApp terminado en").should("exist");
    cy.get("body")
      .invoke("text")
      .should("not.match", /9\d{2} \d{3} \d{3}/);
    cy.revisarAccesibilidad("ficha-telefono-oculto-normal");
  });
});
