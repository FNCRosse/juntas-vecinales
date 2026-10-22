export {};

// Tarifa de la cuota semanal (DIR-COB-20 a DIR-COB-23, HU-COB-16). Marta es directiva y tesorera; Pedro, mediador, la ve sin editarla.
// Cada corrida programa montos distintos: la tarifa de la BD de pruebas conserva lo que se programó en corridas anteriores.

const sufijo = String(Date.now()).slice(-6);
const centimos = (Date.now() % 700) + 300;
const MONTO = (centimos / 100).toFixed(2);
const ACTA = `Acta de asamblea del 20 de setiembre de 2026 (${sufijo})`;

const entrarComo = (dni: string, politica: boolean) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
  if (politica) cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-COB-16 Tarifa de la cuota semanal", () => {
  it("@HU-COB-16 CA1 CA3 la directiva ve los conceptos con su unidad y su monto, y el historial de solo lectura", () => {
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/mas");
    cy.contains("a", "Tarifa de la cuota semanal").click();
    cy.get("h1").should("have.text", "Tarifa de la cuota semanal");
    cy.contains("p", "Vigente desde el").should("contain.text", "aprobada en");
    cy.get("table").within(() => {
      cy.contains("th", "Concepto").should("exist");
      cy.contains("tr", "Casa").should("contain.text", "Por familia");
      cy.contains("tr", "Auto o camioneta").should("contain.text", "Por vehículo");
      cy.contains("tr", "Negocio").should("contain.text", "Por local");
    });
    cy.contains("h2", "Historial de cambios (solo lectura)").should("exist");
    cy.contains("Negocio: de S/ 2.50 a S/ 3.00").should("exist");
    cy.contains("a", "Cambiar un monto o agregar un concepto").should("exist");
    cy.revisarAccesibilidad("tarifa-directiva-360");
  });

  it("@HU-COB-16 CA1 CA2 la directiva cambia un monto en dos pasos, con su acta, y queda programado", () => {
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/tarifa/cambiar");
    cy.get("h1").should("have.text", "Cambiar la tarifa");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("tarifa-cambiar-360");

    cy.esperarHidratacion("Revisar el cambio").click();
    cy.get("#campo-concepto-error").should("contain.text", "Elija el concepto");
    cy.get("#campo-monto-error").should("contain.text", "Escriba un monto en soles");
    cy.get("#campo-acta-error").should("contain.text", "Escriba el acta de asamblea");
    cy.revisarAccesibilidad("tarifa-cambiar-errores-360");

    cy.contains("button", "Elegir el concepto").click();
    cy.contains("button", "Auto o camioneta").click();
    cy.contains("p", "Hoy:").should("contain.text", "por vehículo");
    cy.get("#campo-monto").type(MONTO);
    cy.get("#campo-acta").type(ACTA);
    cy.contains("button", "Revisar el cambio").click();

    cy.get("h1").should("have.text", "¿Desea cambiar la tarifa?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "Auto o camioneta").should("exist");
    cy.contains("dd", `S/ ${MONTO}`).should("exist");
    cy.contains("dd", ACTA).should("exist");
    cy.contains("Las cuotas ya emitidas no cambian").should("exist");
    cy.revisarAccesibilidad("tarifa-confirmar-360");
    cy.contains("button", "Sí, cambiar la tarifa").click();

    cy.contains('[role="status"]', "Cambio programado").should("exist");
    cy.revisarAccesibilidad("tarifa-programada-360");
    cy.contains("a", "Volver a la tarifa").click();
    cy.contains('[role="status"]', `a S/ ${MONTO}`).should("contain.text", "Cambio programado");
    cy.contains("li", `a S/ ${MONTO}`).should("contain.text", "Auto o camioneta");
  });

  it("@HU-COB-16 CA1 la directiva agrega un concepto nuevo con su nombre y cómo se cobra", () => {
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/tarifa/cambiar");
    cy.esperarHidratacion("Revisar el cambio");
    cy.contains("button", "Elegir el concepto").click();
    cy.contains("button", "Agregar un concepto nuevo").click();
    cy.contains("button", "Escribir").click();
    cy.get('[role="dialog"]').within(() => {
      cy.get("#campo-nombre").type(`Bicicleta ${sufijo}`);
      cy.contains("label", "Por vehículo").click();
      cy.get("#campo-monto").type("0.30");
      cy.contains("button", "Listo").click();
    });
    cy.get("#campo-acta").type(ACTA);
    cy.revisarAccesibilidad("tarifa-nuevo-concepto-360");
    cy.contains("button", "Revisar el cambio").click();
    cy.contains("dd", `Bicicleta ${sufijo}`).should("exist");
    cy.contains("dd", "Es un concepto nuevo").should("exist");
    cy.contains("button", "Sí, cambiar la tarifa").click();
    cy.contains('[role="status"]', "Ninguna casa paga todavía").should("exist");
  });

  it("@HU-COB-16 CA1 el mediador ve la tarifa sin poder editarla, en modo Senior", () => {
    entrarComo("40000003", false);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/tarifa");
    cy.get("h1").should("have.text", "Tarifa de la cuota semanal");
    cy.contains("tr", "Auto o camioneta").should("exist");
    cy.contains("a", "Cambiar un monto").should("not.exist");
    cy.contains("Solo la directiva cambia la tarifa").should("exist");
    cy.revisarAccesibilidad("tarifa-mediador-senior-360");

    // Sin ser directiva, ni la pantalla de cambiar ni el endpoint lo permiten.
    cy.visit("/directiva/cobros/tarifa/cambiar");
    cy.location("pathname").should("not.eq", "/directiva/cobros/tarifa/cambiar");
    cy.request({
      method: "PUT",
      url: "/api/aportes/tarifa",
      body: {
        concepto: "auto",
        monto: 999,
        vigencia: "2099-01-04",
        acta: "Acta",
        idOperacion: crypto.randomUUID(),
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });

  it("@HU-COB-16 CA1 un vecino no ve la tarifa", () => {
    cy.entrarComoVecinaNueva("Vecina de Prueba");
    cy.request({ url: "/api/aportes/tarifa", failOnStatusCode: false }).its("status").should("eq", 403);
  });
});

describe("@HU-COB-16 CA3 Historial de acciones de la directiva", () => {
  it("@HU-COB-16 CA3 el historial de solo lectura muestra el cambio de tarifa programado, en teléfono y en modo Senior", () => {
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/mas");
    cy.contains("a", "Historial de acciones").click();
    cy.get("h1").should("have.text", "Historial de acciones");
    cy.contains("Solo lectura").should("exist");
    cy.contains("h2", "Programó un cambio de tarifa").should("exist");
    cy.contains("Marta Rojas").should("exist");
    cy.revisarAccesibilidad("historial-directiva-360");

    cy.guardarModo("senior");
    cy.visit("/directiva/historial");
    cy.contains("h2", "Programó un cambio de tarifa").should("exist");
    cy.revisarAccesibilidad("historial-directiva-senior-360");
  });
});
