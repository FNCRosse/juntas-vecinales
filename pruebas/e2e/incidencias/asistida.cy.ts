export {};

// Reporte asistido por el mediador (DIR-QUE-08, DIR-QUE-09, DIR-QUE-10).

describe("@HU-QUE-03 Queja asistida por el mediador", () => {
  it("@HU-QUE-03 CA1 CA2 CA3 el mediador busca a la vecina, registra con anonimato y obtiene la constancia, en modo Senior", () => {
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/directiva/incidentes");
    cy.contains("a", "Registrar un reporte por un vecino").click();
    cy.get("h1").should("have.text", "Registrar un reporte por un vecino");
    cy.esperarHidratacion("Revisar el reporte").click();
    cy.get("#campo-consentimiento").should("contain.text", "Confirme que el vecino aceptó");
    cy.revisarAccesibilidad("asistido-faltan-senior-360");

    cy.get("#campo-vecino").type("Carmen");
    cy.contains("button", "Buscar al vecino").click();
    cy.contains("label", "Carmen Huamán · Mz. C, lote 7").click();
    cy.contains("button", "Cambiar de vecino").should("exist");
    cy.contains("label", "Basura").click();
    cy.contains("label", "Mz. D").click();
    cy.get("#campo-descripcion").type("Dejan bolsas de basura en la esquina desde hace una semana.");
    cy.get('[role="switch"]').click();
    cy.contains("label", "El vecino aceptó la política de privacidad").click();
    cy.revisarAccesibilidad("asistido-completo-senior-360");
    cy.contains("button", "Revisar el reporte").click();

    cy.get("h1").should("have.text", "¿Desea registrar este reporte?");
    cy.contains("dd", "No, se mantiene en reserva").should("exist");
    cy.revisarAccesibilidad("asistido-confirmar-senior-360");
    cy.contains("button", "Sí, registrar el reporte").click();

    cy.get("h1").should("contain.text", "Constancia del reporte N.°");
    cy.contains('[role="status"]', "Entréguele la constancia a Carmen Huamán").should("exist");
    cy.contains("dd", /^Q-\d{4}-\d{5}-[A-Z2-9]{4}$/).should("exist");
    cy.contains("dd", "Pedro Chávez, directivo mediador, a pedido del vecino").should("exist");
    cy.contains("button", "Imprimir la constancia").should("exist");
    cy.revisarAccesibilidad("asistido-constancia-senior-360");
    cy.guardarModo("normal");
  });
});
