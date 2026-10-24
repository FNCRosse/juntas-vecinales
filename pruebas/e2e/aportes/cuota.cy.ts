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
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    // El mediador no es vecino: la pantalla de vecinos lo manda a su propio inicio.
    cy.visit("/cuota");
    cy.location("pathname").should("not.eq", "/cuota");
  });
});

describe("@HU-COB-02 Estado de cuenta privado: Mis pagos y recibos", () => {
  it("@HU-COB-02 CA1 sin pagos todavía, Mis pagos y recibos lo dice y se llega desde Mi cuota", () => {
    cy.entrarComoVecinaNueva("Vecina Sin Pagos");
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.contains("a", "Mis pagos y recibos").click();
    cy.get("h1").should("have.text", "Mis pagos y recibos");
    cy.contains("Todavía no tiene pagos registrados").should("exist");
    cy.revisarAccesibilidad("pagos-vacio-360");
    cy.contains("a", "Volver a Mi cuota").click();
    cy.location("pathname").should("eq", "/cuota");
  });

  it("@HU-COB-02 CA1 CA3 las semanas pagadas pasan al historial y el saldo se actualiza en cuanto hay un abono", () => {
    cy.entrarComoVecinaNueva("Vecina Con Pagos").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [
          { periodo: "2026-09-07", estado: "PENDIENTE", lineas: [CASA, INQUILINO] },
          { periodo: "2026-09-14", estado: "PENDIENTE", lineas: [CASA, INQUILINO] },
        ],
      });
      cy.viewport(360, 800);
      cy.visit("/cuota");
      cy.contains("p", "S/ 10.00").should("exist");
      cy.contains("2 semanas pendientes").should("exist");

      // Un pago parcial: queda lo que falta y cuánto ya pagó.
      cy.task("abonarCuota", { dni, periodo: "2026-09-07", saldo: 200, estado: "PENDIENTE" });
      cy.reload();
      cy.contains("p", "S/ 7.00").should("exist");
      cy.contains("article", "Semana del 7 al 13 de setiembre").should(
        "contain.text",
        "Falta S/ 2.00 · ya pagó S/ 3.00",
      );
      cy.revisarAccesibilidad("cuota-pago-parcial-360");

      // Un pago completo: la semana sale de lo pendiente y entra al historial.
      cy.task("abonarCuota", { dni, periodo: "2026-09-07", saldo: 0, estado: "PAGADA" });
      cy.task("abonarCuota", { dni, periodo: "2026-09-14", saldo: 0, estado: "PAGADA" });
      cy.reload();
      cy.contains("p", "Está al día").should("exist");
      cy.contains("a", "Mis pagos y recibos").click();
      cy.contains("article", "Semana del 7 al 13 de setiembre").should("contain.text", "Pagada");
      cy.contains("article", "Semana del 14 al 20 de setiembre").should("contain.text", "S/ 5.00");
      cy.revisarAccesibilidad("pagos-con-historial-360");
      cy.guardarModo("senior");
      cy.reload();
      cy.revisarAccesibilidad("pagos-con-historial-senior-360");
    });
  });

  it("@HU-COB-02 CA2 el estado de cuenta por la API es el de la casa de quien pide, sin guardarse en caché", () => {
    cy.entrarComoVecinaNueva("Vecina Privada").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [{ periodo: "2026-09-21", estado: "PENDIENTE", lineas: [CASA] }],
      });
    });
    cy.request("/api/aportes/estado-cuenta?predioId=otra&dni=08123478").then((r) => {
      expect(r.status).to.eq(200);
      expect(r.headers["cache-control"]).to.eq("private, no-store");
      expect(r.body.debe).to.eq(250);
      expect(JSON.stringify(r.body)).not.to.contain("Mz. C");
    });
  });
});
