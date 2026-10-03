export {};

// Guía de la sección Incidentes (HU-ACC-10): se ofrece la primera vez, se pausa, se retoma y, una vez
// vista, ya no se ofrece sola; desde Ayuda y accesibilidad se vuelve a ver.

describe("@HU-ACC-10 Tutorial guiado por sección", () => {
  it("@HU-ACC-10 CA1 CA2 CA3 la vecina pausa la guía de Incidentes, la retoma, la termina y la vuelve a ver desde Ayuda", () => {
    cy.entrarComoVecinaNueva("Clara Ruiz Peña");
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/incidentes");
    cy.contains('[role="note"]', "¿Quiere ver cómo funciona esta sección?").should("exist");
    cy.revisarAccesibilidad("incidentes-oferta-guia-senior-360");
    cy.contains("a", "Ver la guía").click();
    cy.contains("p", "Guía de Incidentes · paso 1 de 4 · es opcional").should("exist");
    cy.get("h1").should("have.text", "Avise de un problema del barrio");
    cy.contains("strong", "Reportar un problema").should("exist");
    cy.revisarAccesibilidad("guia-incidentes-paso1-senior-360");
    cy.esperarHidratacion("Siguiente").click();
    cy.get("h1").should("have.text", "Puede enviarlo sin su nombre");
    cy.contains("button", "Pausar y seguir después").click();
    cy.location("pathname").should("eq", "/incidentes");
    cy.contains('[role="note"]', "¿Sigue con la guía de esta sección?").within(() =>
      cy.contains("a", "Seguir la guía").click(),
    );
    cy.get("h1").should("have.text", "Puede enviarlo sin su nombre");
    cy.esperarHidratacion("Siguiente").click();
    cy.contains("button", "Siguiente").click();
    cy.contains("button", "Terminar e ir a Incidentes").click();
    cy.location("pathname").should("eq", "/incidentes");
    cy.get('[role="note"]').should("not.exist");

    cy.visit("/mas/ayuda-y-accesibilidad");
    cy.contains("li", "Incidentes").should("contain.text", "Ya la vio");
    cy.revisarAccesibilidad("ayuda-guias-senior-360");
    cy.contains("a", "Ver la guía de Incidentes").click();
    cy.contains("p", "paso 1 de 4").should("exist");
    cy.esperarHidratacion("Saltar la guía (no se volverá a mostrar)");
    cy.guardarModo("normal");
  });
});
