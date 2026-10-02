export {};

// Inicio del vecino (VEC-ACC-09). En M1 tiene el saludo, la vivienda y "Mis avisos"; M3 a M5 suman
// sus bloques. Marta es directiva y vecina de Mz. A, lote 12.

describe("@HU-GAR-19 Panel de inicio", () => {
  it("@HU-GAR-19 CA1 CA2 CA3 saluda, muestra la vivienda y lleva a sus avisos nuevos", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.task("avisosDePrueba", {
      dni: "40000002",
      avisos: [{ tipo: "ASAMBLEAS", titulo: "Asamblea el sábado", texto: "A las 4 p. m. en el local." }],
    });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/");
    cy.get("h1").should("contain.text", "Marta");
    cy.contains("p", "Mz. A, lote 12").should("exist");
    cy.contains("a", "Mis avisos").should("contain.text", "nuevo");
    cy.revisarAccesibilidad("inicio-vecino-senior-360");
    cy.contains("a", "Mis avisos").click();
    cy.location("pathname").should("eq", "/avisos");
    cy.esperarHidratacion("Marcar todos como leídos").click();
    cy.visit("/");
    cy.contains("a", "Mis avisos").should("contain.text", "No tiene avisos nuevos");
  });
});
