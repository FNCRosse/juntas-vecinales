export {};

// DIR-19 (HU-COB-11): desde la ficha de «Poner al día», la directiva o el mediador cobra en efectivo algunas semanas a un
// vecino que no pidió el cobro en casa. Se diferencia de «Registrar el pago total», que paga toda la deuda.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];

describe(
  "@HU-COB-11 [DIR-19] Cobrar en efectivo sin pedido de cobro en casa",
  { defaultCommandTimeout: 15000 },
  () => {
    it("@HU-COB-11 [DIR-19] [MED-13] el mediador cobra una semana desde la ficha y la casa sigue debiendo el resto", () => {
      const nombre = `Vecina Sin Pedido ${sufijo}`;
      cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
        cy.task("emitirCuotas", {
          dni,
          cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "VENCIDA", lineas: [CASA] })),
        });
      });
      cy.clearCookies();
      cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
      cy.request("POST", "/api/auth/politica", { acepto: true });
      cy.guardarModo("senior");
      cy.viewport(360, 800);

      cy.visit("/directiva/cobros/poner-al-dia");
      cy.contains("li", "Cobrar en efectivo").should(
        "contain.text",
        "aunque no haya pedido el cobro en casa",
      );
      cy.get("#campo-q").type(nombre);
      cy.contains("button", "Buscar").click();
      cy.contains("article", nombre).within(() => {
        cy.contains("a", "Registrar el pago total").should("exist");
        cy.contains("a", "Cobrar en efectivo").click();
      });

      cy.get("h1").should("have.text", `Cobrar en efectivo a ${nombre}`);
      cy.contains("debe S/ 7.50").should("exist");
      cy.revisarAccesibilidad("cobrar-sin-pedido-senior-360");
      cy.get("#campo-semanas").click();
      cy.get("[role=dialog]").should("contain.text", "Todo lo pendiente: S/ 7.50");
      cy.get("[role=dialog]").contains("button", "1 semana: S/ 2.50").click();
      cy.contains("button", "Revisar el cobro").click();

      cy.get("h1").should("have.text", "¿Desea registrar este cobro en efectivo?");
      cy.contains("dd", "S/ 2.50").should("exist");
      cy.contains("dd", "En efectivo, cobrado por la directiva").should("exist");
      cy.revisarAccesibilidad("cobrar-sin-pedido-confirmar-senior-360");
      cy.contains("button", "Sí, registrar el cobro").click();

      cy.contains('[role="status"]', "Cobro registrado").should(
        "contain.text",
        `${nombre} todavía debe S/ 5.00`,
      );
      cy.contains("a", "Ver el recibo").should("exist");
    });
  },
);
