export {};

// Pedir ayuda a una persona (VEC-AYU-01 a 03) y la bandeja del mediador (DIR-AYU-01). Marta es
// directiva y vecina; Pedro, el directivo mediador de las semillas.

const CLAVE = "clave-de-prueba";

describe("@HU-ACC-04 Pedir ayuda humana desde cualquier pantalla", () => {
  it("@HU-ACC-04 CA1 CA2 CA3 la vecina pide ayuda desde su pantalla y el mediador la atiende", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: CLAVE });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.visit("/avisos");
    cy.contains("header a", "Pedir ayuda").should("have.attr", "href", "/mas/ayuda?desde=%2Favisos").click();

    cy.get("h1").should("have.text", "Pedir ayuda a una persona");
    cy.contains("dd", "Marta Rojas, Mz. A, lote 12").should("exist");
    cy.contains("dd", "Avisos").should("exist");
    cy.revisarAccesibilidad("pedir-ayuda-normal");
    cy.contains("label", "Que me escriban por WhatsApp").click();
    cy.get("#campo-detalle").type("No encuentro mis avisos de pago.");
    cy.esperarHidratacion("Pedir ayuda").click();
    cy.get("h1").should("have.text", "Ya pedimos ayuda por usted");
    cy.contains('[role="status"]', "Pedido enviado a Pedro Chávez").should(
      "contain.text",
      "le escribirá por WhatsApp",
    );
    cy.revisarAccesibilidad("pedido-enviado-normal");

    cy.visit("/mas/ayuda-y-accesibilidad");
    cy.contains("li", "Ayuda en: Avisos").should("contain.text", "Pendiente");

    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: CLAVE });
    cy.visit("/directiva/mas");
    cy.contains("a", "Pedidos de ayuda").should("contain.text", "por atender").click();
    cy.contains("li", "Marta Rojas, Mz. A, lote 12")
      .as("pedido")
      .should("contain.text", "Se quedó en: Avisos");
    cy.revisarAccesibilidad("pedidos-de-ayuda-normal");
    cy.esperarHidratacion("Lo atiendo yo").click();
    cy.get("@pedido").should("contain.text", "En atención");
    cy.contains("button", "Marcar como atendido").click();
    cy.contains("li", "Marta Rojas, Mz. A, lote 12").should("contain.text", "Atendido por Pedro Chávez");
  });

  it("@HU-ACC-04 CA1 en modo Senior, el botón está en la barra y la ayuda del equipo da el contacto", () => {
    cy.clearCookies();
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.request("POST", "/api/auth/clave", { dni: "40000004", clave: CLAVE });
    cy.visit("/garita");
    cy.contains("header a", "Pedir ayuda").click();
    cy.get("h1").should("have.text", "Pedir ayuda");
    cy.contains("a", "Llamar al 900 000 001").should("have.attr", "href", "tel:+51900000001");
    cy.revisarAccesibilidad("ayuda-equipo-senior-360");
  });
});
