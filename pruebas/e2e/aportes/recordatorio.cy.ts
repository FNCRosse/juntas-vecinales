export {};

// El recordatorio amable de la cuota (HU-COB-05) llega a la vecina como un aviso de «Pagos» en Avisos (VEC-ACC-11). La tarea
// del worker no corre en el CI: su texto y su efecto se prueban en integración (alertaPreventiva.test.ts); aquí se prueba
// cómo se lee y se encuentra en la pantalla, con un aviso creado en la BD de pruebas con el mismo texto.

const TITULO = "Un recordatorio amable sobre su cuota";
const TEXTO =
  "Su cuota de la semana del 7 al 13 de setiembre todavía está pendiente. Hoy debe S/ 15.00. Puede pagarla cuando le sea posible, sin ningún costo adicional: con Yape o Plin (987 654 321, a nombre de Junta Vecinal), por transferencia a la cuenta 191-2345678-0-12 o pidiendo que vayan a cobrarle en efectivo a su casa. Véala en Mi cuota.";

describe("@HU-COB-05 Recordatorio amable de la cuota", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-05 CA2 la vecina lo lee en Avisos, como un aviso de pagos, sin palabras de sanción", () => {
    cy.entrarComoVecinaNueva("Vecina Con Recordatorio").then(({ dni }) => {
      cy.task("avisosDePrueba", { dni, avisos: [{ tipo: "PAGOS", titulo: TITULO, texto: TEXTO }] });
    });
    cy.viewport(360, 800);
    cy.visit("/avisos");
    cy.get("h1").should("have.text", "Avisos");
    cy.contains("li", TITULO)
      .should("contain.text", "Hoy debe S/ 15.00")
      .and("contain.text", "Yape o Plin")
      .and("contain.text", "sin ningún costo adicional");
    cy.get("main")
      .invoke("text")
      .should("not.match", /moros|recargo|sanci|multa|suspend|castig|deudor/i);
    cy.revisarAccesibilidad("recordatorio-avisos-360");

    cy.esperarHidratacion("Filtrar").click();
    cy.contains("a", "Pagos").click();
    cy.contains("li", TITULO).should("exist");
    cy.revisarAccesibilidad("recordatorio-avisos-pagos-360");
  });

  it("@HU-COB-05 CA2 en vista grande se lee igual y sin violaciones de accesibilidad", () => {
    cy.entrarComoVecinaNueva("Vecina Con Recordatorio Grande").then(({ dni }) => {
      cy.task("avisosDePrueba", { dni, avisos: [{ tipo: "PAGOS", titulo: TITULO, texto: TEXTO }] });
    });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/avisos");
    cy.contains("li", TITULO).should("contain.text", "Véala en Mi cuota.");
    cy.revisarAccesibilidad("recordatorio-avisos-senior-360");
  });
});
