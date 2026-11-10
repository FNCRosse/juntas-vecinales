export {};

// La reja no se abre sola (VEC-COB-12; HU-COB-06). La tarea del worker que suspende a las 8 semanas no corre en el CI: su efecto se
// prueba en integración (suspensionPorAtraso.test.ts). Aquí se prueba lo que ve la casa, con la reja suspendida en la BD de pruebas.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = [
  "2026-07-27",
  "2026-08-03",
  "2026-08-10",
  "2026-08-17",
  "2026-08-24",
  "2026-08-31",
  "2026-09-07",
  "2026-09-14",
];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

describe("@HU-COB-06 El vigilante no le abrirá la reja", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-06 CA3 [VEC-28] la casa suspendida ve qué pasa, cuánto debe y cómo volver a la normalidad, sin la palabra «moroso»", () => {
    cy.entrarComoVecinaNueva(`Vecina Con Reja ${sufijo}`).then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "VENCIDA", lineas: [CASA] })),
      });
      cy.task("suspenderReja", { dni });
    });
    cy.viewport(360, 800);
    cy.visit("/cuota");
    // VEC-28: el aviso pide ponerse al día y dice que el vigilante no podrá abrir la reja al vehículo.
    cy.contains('[role="status"]', "Por favor, pague su deuda pendiente").should(
      "contain.text",
      "el vigilante no podrá abrirle la reja a su vehículo",
    );
    cy.revisarAccesibilidad("cuota-reja-suspendida-360");
    cy.contains("a", "Ver qué significa").click();

    cy.get("h1").should("have.text", "Por ahora el vigilante no le abrirá la reja");
    cy.contains("Tiene 8 semanas pendientes").should("exist");
    cy.contains("S/ 20.00").should("exist");
    cy.contains("8 semanas, del 27 de julio al 20 de setiembre").should("exist");
    cy.contains("h2", "Qué significa").should("exist");
    // VEC-28: no es que la reja «no se abra sola»; es que el vigilante no le abrirá la reja al vehículo.
    cy.contains("el vigilante no le abre la reja a su vehículo: tendrá que abrirla usted mismo.").should(
      "exist",
    );
    cy.get("main").should("not.contain.text", "abre sola").and("not.contain.text", "abrirse sola");
    cy.contains("Por ahora tampoco puede registrar visitas nuevas.").should("exist");
    cy.contains("h2", "Cómo volver a la normalidad").should("exist");
    cy.contains("Apenas la directiva lo valide, el vigilante vuelve a abrirle la reja y le avisamos.").should(
      "exist",
    );
    cy.get("main")
      .invoke("text")
      .should("not.match", /moros|deudor|castig|multa|sanci/i);
    cy.revisarAccesibilidad("reja-no-se-abre-sola-360");

    cy.contains("a", "Hablar con la directiva").click();
    cy.location("pathname").should("eq", "/mas/ayuda");
    cy.go("back");
    cy.contains("a", "Pagar mi cuota").click();
    cy.location("pathname").should("eq", "/cuota/pagar");
  });

  it("@HU-COB-06 en vista grande la pantalla tiene pocos objetivos y sin violaciones de accesibilidad", () => {
    cy.entrarComoVecinaNueva(`Vecina Con Reja Grande ${sufijo}`).then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "VENCIDA", lineas: [CASA] })),
      });
      cy.task("suspenderReja", { dni });
    });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/cuota/reja");
    cy.get("h1").should("have.text", "Por ahora el vigilante no le abrirá la reja");
    cy.get("main").then(($main) => expect($main.find(OBJETIVOS).length, "objetivos en la reja").to.be.lte(6));
    cy.revisarAccesibilidad("reja-no-se-abre-sola-senior-360");
  });

  it("@HU-COB-06 una casa con la reja abierta no tiene nada que explicar: vuelve a Mi cuota", () => {
    cy.entrarComoVecinaNueva(`Vecina Sin Reja ${sufijo}`);
    cy.visit("/cuota/reja");
    cy.location("pathname").should("eq", "/cuota");
    cy.contains("Por ahora el vigilante no le abrirá la reja").should("not.exist");
  });
});
