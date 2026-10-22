export {};

// Mi cuota (VEC-COB-01, HU-COB-01 CA1). Cada prueba empadrona a una vecina nueva: así sus cuotas no dependen de otras
// corridas. El cálculo de la cuota lo prueban las pruebas de integración; aquí se arma lo que la pantalla muestra.

const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const INQUILINO = {
  clave: "inquilino",
  nombre: "Inquilino",
  unidad: "POR_INQUILINO",
  monto: 250,
  cantidad: 1,
};

describe("@HU-COB-01 Mi cuota", () => {
  it("@HU-COB-01 CA1 sin cuotas todavía, la vecina está al día y se le explica cuándo llega la primera", () => {
    cy.entrarComoVecinaNueva("Vecina Sin Cuotas");
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.get("h1").should("have.text", "Mi cuota");
    cy.contains("p", "Está al día").should("exist");
    cy.contains("Todavía no tiene cuotas").should("exist");
    cy.revisarAccesibilidad("cuota-sin-cuotas-360");
  });

  it("@HU-COB-01 CA1 la vecina ve lo que debe semana por semana y cómo se calcula su cuota, en teléfono", () => {
    cy.entrarComoVecinaNueva("Vecina Con Cuotas").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [
          { periodo: "2026-09-07", estado: "VENCIDA", lineas: [CASA, INQUILINO] },
          { periodo: "2026-09-14", estado: "VENCIDA", lineas: [CASA, INQUILINO] },
          { periodo: "2026-09-21", estado: "PENDIENTE", lineas: [CASA, INQUILINO] },
        ],
      });
    });
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.get("h1").should("have.text", "Mi cuota");
    cy.contains("h2", "Lo que debe hoy").should("exist");
    cy.contains("p", "S/ 15.00").should("exist");
    cy.contains("3 semanas pendientes").should("exist");
    cy.contains("article", "Semana del 7 al 13 de setiembre").should("contain.text", "Con retraso");
    cy.contains("article", "Semana del 21 al 27 de setiembre").should("contain.text", "Pendiente");
    cy.contains("Solo usted y la directiva ven esta información.").should("exist");
    cy.get("table").within(() => {
      cy.contains("tr", "Casa").should("contain.text", "S/ 2.50");
      cy.contains("tr", "Inquilino (1)").should("contain.text", "S/ 2.50");
      cy.contains("tr", "Total por semana").should("contain.text", "S/ 5.00");
    });
    cy.revisarAccesibilidad("cuota-con-deuda-360");
  });

  it("@HU-COB-01 CA1 en modo Senior la cuota se lee igual, con el mismo resumen y sin scroll a los lados", () => {
    cy.entrarComoVecinaNueva("Vecina Senior Cuotas").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [{ periodo: "2026-09-21", estado: "PENDIENTE", lineas: [CASA] }],
      });
    });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.contains("p", "S/ 2.50").should("exist");
    cy.contains("1 semana pendiente").should("exist");
    cy.document().then((d) => expect(d.documentElement.scrollWidth).to.be.lte(360));
    cy.revisarAccesibilidad("cuota-con-deuda-senior-360");
  });

  it("@HU-COB-01 CA1 el mediador, que no es vecino, no entra a Mi cuota", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    // El mediador no es vecino: la pantalla de vecinos lo manda a su propio inicio.
    cy.visit("/cuota");
    cy.location("pathname").should("not.eq", "/cuota");
  });
});
