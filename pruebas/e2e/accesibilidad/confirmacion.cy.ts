export {};

// Confirmación en dos pasos y retroalimentación no punitiva (HU-ACC-03).

describe("@HU-ACC-03 Confirmación en dos pasos", () => {
  beforeEach(() => cy.guardarModo("normal"));

  it("@HU-ACC-03 CA1 muestra la acción, el monto y las opciones Confirmar y Cancelar antes de consumarse", () => {
    cy.viewport(360, 800);
    cy.visit("/catalogo");
    cy.esperarHidratacion("Revisar y enviar mi comprobante");
    cy.get("#campo-monto").clear().type("12.50");
    cy.contains("button", "Revisar y enviar mi comprobante").click();

    cy.get("[role=dialog]").within(() => {
      cy.contains("h2", "Revise su pago antes de enviarlo");
      cy.contains("dt", "Qué paga").next("dd").should("have.text", "Cuota semanal");
      cy.contains("dt", "Monto").next("dd").should("have.text", "S/ 12.50");
      cy.contains("button", "Enviar mi comprobante");
      cy.contains("button", "Cancelar");
    });
    cy.revisarAccesibilidad("confirmacion-normal-telefono");
    cy.contains("[role=status]", "Recibimos su comprobante").should("not.exist");
  });

  it("@HU-ACC-03 CA3 Cancelar sale sin perder lo que ya escribió", () => {
    cy.visit("/catalogo");
    cy.esperarHidratacion("Revisar y enviar mi comprobante");
    cy.get("#campo-monto").clear().type("7.50");
    cy.contains("button", "Revisar y enviar mi comprobante").click();
    cy.get("[role=dialog]").contains("button", "Cancelar").click();
    cy.get("[role=dialog]").should("not.exist");
    cy.get("#campo-monto").should("have.value", "7.50");
    cy.contains("Recibimos su comprobante").should("not.exist");
  });

  it("@HU-ACC-03 CA1 al confirmar, el resultado se confirma en la página y no desaparece solo", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/catalogo");
    cy.esperarHidratacion("Revisar y enviar mi comprobante");
    cy.contains("button", "Revisar y enviar mi comprobante").click();
    cy.revisarAccesibilidad("confirmacion-senior-telefono");
    cy.get("[role=dialog]").contains("button", "Enviar mi comprobante").click();
    cy.get("[role=dialog]").should("not.exist");
    cy.contains("[role=status]", "Recibimos su comprobante").should("be.visible");
    cy.wait(3000);
    cy.contains("[role=status]", "Recibimos su comprobante").should("be.visible");
  });

  it("@HU-ACC-03 CA2 el error va junto al campo, dice cómo corregirlo y no culpa", () => {
    cy.visit("/catalogo");
    cy.esperarHidratacion("Revisar y enviar mi comprobante");
    cy.get("#campo-telefono")
      .should("have.attr", "aria-invalid", "true")
      .and("have.value", "98765")
      .invoke("attr", "aria-describedby")
      .then((ids) => {
        cy.get(`#${String(ids).split(" ")[0]}`)
          .should("have.text", "Al número le faltan 4 números. Escríbalo completo, con sus 9 números.")
          .invoke("text")
          .should("not.match", /error|inválid|incorrect/i);
      });
  });
});
