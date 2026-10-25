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
    cy.get("main").contains("li", "Incidentes").should("contain.text", "Ya la vio");
    cy.revisarAccesibilidad("ayuda-guias-senior-360");
    cy.contains("a", "Ver la guía de Incidentes").click();
    cy.contains("p", "paso 1 de 4").should("exist");
    cy.esperarHidratacion("Saltar la guía (no se volverá a mostrar)");
    cy.guardarModo("normal");
  });

  it("@HU-ACC-03 CA4 Ahora no muestra Listo y Deshacer; sin deshacer, la guía no se vuelve a ofrecer (R-12)", () => {
    cy.entrarComoVecinaNueva("Rita Soto León");
    cy.viewport(360, 800);
    cy.visit("/incidentes");
    cy.esperarHidratacion("Ahora no").click();
    cy.contains('[role="status"]', "Listo.").should("contain.text", "No le volveremos a ofrecer");
    cy.contains('[role="note"]', "¿Quiere ver cómo funciona").should("not.exist");
    cy.contains("button", "Deshacer").click();
    cy.get('[role="note"]').should("exist");
    cy.reload();
    cy.get('[role="note"]').should("exist");

    cy.esperarHidratacion("Ahora no").click();
    cy.contains('[role="status"]', "Listo.").should("exist");
    cy.reload();
    cy.get('[role="note"]').should("not.exist");
  });

  it("@HU-ACC-10 CA1 CA2 la vecina ve la guía de Asambleas la primera vez, en cuatro pasos, y la termina", () => {
    cy.entrarComoVecinaNueva("Marina Vega Soto");
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/asambleas");
    cy.contains('[role="note"]', "¿Quiere ver cómo funciona esta sección?").should("exist");
    cy.revisarAccesibilidad("asambleas-oferta-guia-senior-360");
    cy.contains("a", "Ver la guía").click();
    cy.contains("p", "Guía de Asambleas · paso 1 de 4 · es opcional").should("exist");
    cy.get("h1").should("have.text", "Confirme si irá a la asamblea");
    cy.contains("strong", "Sí, asistiré").should("exist");
    cy.revisarAccesibilidad("guia-asambleas-paso1-senior-360");
    cy.esperarHidratacion("Siguiente").click();
    cy.get("h1").should("have.text", "Vea cuántos van");
    cy.contains("button", "Siguiente").click();
    cy.get("h1").should("have.text", "Si no puede ir, deje su voto");
    cy.contains("button", "Siguiente").click();
    cy.get("h1").should("have.text", "Proponga un tema");
    cy.contains("button", "Terminar e ir a Asambleas").click();
    cy.location("pathname").should("eq", "/asambleas");
    cy.get('[role="note"]').should("not.exist");
    cy.guardarModo("normal");
  });

  it("@HU-ACC-10 CA1 CA2 la guía de Mi cuota se ofrece la primera vez, nombra cada acción como se ve y se salta para siempre", () => {
    cy.entrarComoVecinaNueva("Lucía Mendoza Rojas");
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/cuota");
    cy.get("h1").should("have.text", "Mi cuota");
    cy.contains('[role="note"]', "¿Quiere ver cómo funciona esta sección?").should("exist");
    cy.revisarAccesibilidad("cuota-oferta-guia-senior-360");
    cy.contains("a", "Ver la guía").click();
    cy.contains("p", "Guía de Mi cuota · paso 1 de 5 · es opcional").should("exist");
    cy.get("h1").should("have.text", "Vea cuánto debe");
    cy.contains("strong", "Lo que debe hoy").should("exist");
    cy.revisarAccesibilidad("guia-cuota-paso1-senior-360");
    cy.esperarHidratacion("Siguiente").click();
    cy.get("h1").should("have.text", "Pague con una foto");
    cy.contains("strong", "Pagar mi cuota").should("exist");
    cy.contains("button", "Saltar la guía (no se volverá a mostrar)").click();
    cy.location("pathname").should("eq", "/cuota");
    cy.get('[role="note"]').should("not.exist");
    cy.visit("/mas/ayuda-y-accesibilidad");
    cy.get("main").contains("li", "Mi cuota").should("contain.text", "La saltó");
    cy.guardarModo("normal");
  });
});
