export {};

// DIR-13: la directiva vuelve a ver todos los recibos y los busca (HU-COB-12).

describe("@HU-COB-12 [DIR-13] Todos los recibos", () => {
  it("@HU-COB-12 [DIR-13] Cobros lleva a la lista de recibos, con buscador y sin errores de accesibilidad", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.visit("/directiva/cobros");
    cy.contains("a", "Todos los recibos").should("have.attr", "href", "/directiva/cobros/recibos").click();
    cy.get("h1").should("have.text", "Todos los recibos");
    cy.contains("label", "Buscar un recibo").should("exist");
    cy.revisarAccesibilidad("todos-los-recibos-normal");
    cy.get("#campo-q").type("nadie-con-este-nombre{enter}");
    cy.contains("No encontramos recibos con eso").should("exist");
    cy.revisarAccesibilidad("todos-los-recibos-sin-resultados-normal");
  });
});
