export {};

// Historial público de actas y balances (VEC-TRA-02): lo más reciente primero y, de cada uno, lo que importa.

const sufijo = String(Date.now()).slice(-6);

describe("@HU-ASA-12 Historial público de actas y balances", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
      .its("status")
      .should("eq", 200);
    cy.request("POST", "/api/auth/politica", { acepto: true });
  });

  it("@HU-ASA-12 CA1 CA2 CA3 el vecino ve actas y balances del evento más nuevo al más antiguo, en teléfono y en modo Senior", () => {
    const ACTA = `Asamblea histórica ${sufijo}`;
    const BALANCE = `Bingo histórico ${sufijo}`;
    cy.task<string>("archivoDePrueba", { dni: "40000002" }).then((archivoId) => {
      // Fechas lejanas en el pasado: el historial de pruebas puede tener otras publicaciones más nuevas.
      cy.request("POST", "/api/transparencia/actas", {
        titulo: ACTA,
        fechaAsamblea: "2000-01-10",
        acuerdos: "Se aprobó el reglamento.",
        compromisos: "",
        conclusiones: "",
        idOperacion: crypto.randomUUID(),
      });
      cy.request("POST", "/api/transparencia/balances", {
        titulo: BALANCE,
        fechaActividad: "2000-02-20",
        ingresosVirtuales: 30000,
        ingresosEnPuerta: 20000,
        egresos: [{ concepto: "Premios", monto: 15000, archivoId }],
        idOperacion: crypto.randomUUID(),
      });
    });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/transparencia");
    cy.get("h1").should("have.text", "Actas y balances");
    cy.contains("article", BALANCE).should("contain.text", "Saldo final").and("contain.text", "S/ 350.00");
    cy.contains("article", ACTA).should("contain.text", "Se aprobó el reglamento.");
    cy.get("ul[aria-label='Actas y balances'] > li").then(($items) => {
      const textos = [...$items].map((el) => el.textContent ?? "");
      expect(textos.findIndex((t) => t.includes(BALANCE))).to.be.lessThan(
        textos.findIndex((t) => t.includes(ACTA)),
      );
    });
    cy.revisarAccesibilidad("historial-senior-360");
    cy.guardarModo("normal");
    cy.reload();
    cy.revisarAccesibilidad("historial-normal-360");
  });
});
