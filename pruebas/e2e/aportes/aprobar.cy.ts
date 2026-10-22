export {};

// Revisar y aprobar un comprobante (DIR-COB-02, DIR-COB-03; HU-COB-09). Cada prueba empadrona a una vecina nueva, le emite
// sus cuotas y manda su pago por la API; después la directiva (Marta) lo revisa. El archivo «subido» se crea en la BD de
// pruebas: el CI no habla con R2 (la imagen de la captura no carga, pero tiene su texto alternativo).

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];

/** Crea una vecina con tres semanas por pagar y manda su pago de `semanas` semanas; deja la sesión sin iniciar. */
function vecinaConPago(nombre: string, semanas: number) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
    });
    cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) =>
      cy
        .request("POST", "/api/aportes/pagos/digital", {
          semanas,
          medio: "YAPE_O_PLIN",
          archivoId,
          idOperacion: crypto.randomUUID(),
        })
        .its("status")
        .should("eq", 201),
    );
  });
}

const entrarComoDirectiva = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-COB-09 Revisar y aprobar un comprobante", () => {
  it("@HU-COB-09 CA1 CA2 la directiva compara la captura con lo que figura en la junta y aprueba un pago que cubre todo", () => {
    const nombre = `Vecina Completa ${sufijo}`;
    vecinaConPago(nombre, 3);
    entrarComoDirectiva();
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();

    cy.get("h1").should("have.text", `Pago de ${nombre}`);
    cy.get("img").should("have.attr", "alt").and("contain", "Captura del comprobante");
    cy.contains("h2", "Compare con lo que figura en la junta").should("exist");
    cy.contains("dt", "Monto que declaró").next("dd").should("have.text", "S/ 7.50");
    cy.contains("dt", "Lo que debe esta casa").next("dd").should("have.text", "S/ 7.50");
    cy.contains("dt", "Cuenta de destino").next("dd").should("contain.text", "987 654 321");
    cy.contains("Cubre el 100 %").should("exist");
    cy.contains("la casa pasa a Al día").should("exist");
    cy.revisarAccesibilidad("comprobante-revisar-360");

    cy.esperarHidratacion("Aprobar el pago").click();
    cy.contains("h2", "¿Desea aprobar este pago?").should("exist");
    cy.contains("dd", "S/ 7.50").should("exist");
    cy.contains("dd", nombre).should("exist");
    cy.revisarAccesibilidad("comprobante-aprobar-confirmar-360");
    cy.contains("button", "Sí, aprobar el pago").click();

    cy.contains('[role="status"]', "Pago aprobado").should("contain.text", `${nombre} queda al día.`);
    cy.revisarAccesibilidad("comprobante-aprobado-360");
    cy.contains("a", "Volver a Cobros").click();
    cy.location("pathname").should("eq", "/directiva/cobros");
    cy.contains("article", nombre).should("not.exist");
  });

  it("@HU-COB-09 CA1 CA3 un pago que cubre solo una parte dice cuánto queda y, al aprobarlo, cuánto todavía debe", () => {
    const nombre = `Vecina Parcial ${sufijo}`;
    vecinaConPago(nombre, 1);
    entrarComoDirectiva();
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre)
      .should("contain.text", "Pago parcial")
      .and("contain.text", "Debía S/ 7.50");
    cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();

    cy.contains("Cubre una parte: S/ 2.50 de S/ 7.50").should("exist");
    cy.contains("la casa todavía debe S/ 5.00").should("exist");
    cy.esperarHidratacion("Aprobar el pago").click();
    cy.contains("Todavía deberá S/ 5.00").should("exist");
    cy.contains("button", "Sí, aprobar el pago").click();
    cy.contains('[role="status"]', "Pago aprobado").should("contain.text", `${nombre} todavía debe S/ 5.00.`);
  });

  it("@HU-COB-09 el mediador revisa la captura pero no aprueba, en modo Senior", () => {
    const nombre = `Vecina Mediador ${sufijo}`;
    vecinaConPago(nombre, 3);
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();
    cy.get("h1").should("have.text", `Pago de ${nombre}`);
    cy.contains("Solo la directiva aprueba los pagos.").should("exist");
    cy.contains("button", "Aprobar el pago").should("not.exist");
    cy.revisarAccesibilidad("comprobante-revisar-mediador-senior-360");
  });

  it("@HU-COB-09 sin ser directiva, aprobar por la API responde 403", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.request({
      method: "PATCH",
      url: `/api/aportes/comprobantes/${crypto.randomUUID()}/aprobar`,
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });
});
