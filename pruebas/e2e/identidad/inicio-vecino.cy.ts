export {};

// Inicio del vecino (VEC-ACC-09). En M1 tiene el saludo y "Mis avisos"; M3 suma "Mis
// reportes" y M4 y M5, sus bloques. Marta es directiva y vecina de Mz. A, lote 12.

describe("@HU-GAR-19 Panel de inicio", () => {
  it("@HU-GAR-19 CA1 CA2 CA3 saluda como el prototipo y lleva a sus avisos nuevos", () => {
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
    cy.get("h1").should("have.text", "Hola, Marta");
    // En vista grande se ven 3 bloques: con la cuota de M5 al principio, el resto queda detrás de «Ver más».
    cy.verTodos();
    cy.contains("a", "Mis avisos").should("contain.text", "nuevo");
    cy.contains("a", "Mis reportes").should("have.attr", "href", "/incidentes");
    cy.revisarAccesibilidad("inicio-vecino-senior-360");
    cy.contains("a", "Mis avisos").click();
    cy.location("pathname").should("eq", "/avisos");
    // Se espera a que la petición termine: con la máquina cargada, visitar antes dejaba los avisos sin marcar.
    cy.intercept("POST", "/api/notificaciones/leidas").as("leidas");
    cy.esperarHidratacion("Marcar todos como leídos").click();
    cy.wait("@leidas");
    cy.visit("/");
    cy.contains("a", "Mis avisos").should("contain.text", "No tiene avisos nuevos");
  });
});
