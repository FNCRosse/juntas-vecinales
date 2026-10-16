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
      cy.contains("button", "Sí, enviar mi comprobante");
      cy.contains("button", "Cancelar");
    });
    cy.revisarAccesibilidad("confirmacion-normal-telefono");
    cy.contains("[role=status]", "Recibimos su comprobante").should("not.exist");
  });

  // R-03b y R-12: una sola confirmación; "Sí, …" y "Cancelar" apilados a 24 px (32 en vista grande).
  [
    { modo: "normal", separacion: 24 },
    { modo: "senior", separacion: 32 },
  ].forEach(({ modo, separacion }) => {
    it(`@HU-ACC-03 CA1 en modo ${modo}: "Sí, …" y "Cancelar" van apilados a ${separacion} px`, () => {
      cy.viewport(360, 800);
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/catalogo");
      cy.esperarHidratacion("Revisar y enviar mi comprobante");
      cy.contains("button", "Revisar y enviar mi comprobante").click();
      cy.get("[role=dialog]").within(() => {
        cy.contains("button", "Sí, enviar mi comprobante").then(($si) => {
          cy.contains("button", "Cancelar").then(($no) => {
            const a = $si[0].getBoundingClientRect();
            const b = $no[0].getBoundingClientRect();
            expect(Math.abs(a.left - b.left), "alineados en columna").to.be.lessThan(1);
            expect(b.top - a.bottom, "separación vertical").to.be.at.least(separacion - 0.5);
          });
        });
        cy.get("button").not("[aria-label='Cerrar']").should("have.length", 2);
      });
    });
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
    cy.get("[role=dialog]").contains("button", "Sí, enviar mi comprobante").click();
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

// Acciones reversibles (R-12): sin confirmación, con "Listo" y "Deshacer", sin desaparecer solas.
describe("@HU-ACC-03 Listo con Deshacer", () => {
  ["normal", "senior"].forEach((modo) => {
    it(`@HU-ACC-03 CA4 en modo ${modo}: se aplica sin confirmar, no desaparece solo y Deshacer lo revierte`, () => {
      cy.viewport(360, 800);
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/catalogo");
      cy.esperarHidratacion("Revisar y enviar mi comprobante");
      cy.contains('[role="switch"]', "Recordatorios de pago")
        .should("have.attr", "aria-checked", "false")
        .click();
      cy.get("[role=dialog]").should("not.exist");
      cy.contains("[role=status]", "Listo.").should("be.visible");
      cy.contains('[role="switch"]', "Recordatorios de pago").should("have.attr", "aria-checked", "true");
      cy.revisarAccesibilidad(`listo-deshacer-${modo}-telefono`);
      cy.wait(6000);
      cy.contains("[role=status]", "Listo.").should("exist");
      cy.contains("button", "Deshacer").click();
      cy.contains('[role="switch"]', "Recordatorios de pago").should("have.attr", "aria-checked", "false");
      cy.contains("[role=status]", "Listo.").should("not.exist");
    });
  });

  it("@HU-ACC-03 CA4 Cerrar quita el aviso y deja el cambio hecho", () => {
    cy.visit("/catalogo");
    cy.esperarHidratacion("Revisar y enviar mi comprobante");
    cy.contains('[role="switch"]', "Recordatorios de pago").click();
    cy.contains("button", "Cerrar").click();
    cy.contains("[role=status]", "Listo.").should("not.exist");
    cy.contains('[role="switch"]', "Recordatorios de pago").should("have.attr", "aria-checked", "true");
  });
});
