export {};

// Cuentas del barrio y la caja de vigilancia (DIR-TRA-01 a 05 y VEC-TRA-01; HU-COB-14). La directiva (Marta) registra un gasto con su
// comprobante, revisa la rendición del mes y la publica; una vecina ve los totales sin nada de ninguna casa. El CI no habla con R2:
// la subida de la foto se simula y el archivo «subido» se crea en la BD de pruebas.

const sufijo = String(Date.now()).slice(-6);
const R2_SIMULADO = "https://r2-simulado.invalid/comprobante-caja";
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

const entrarComo = (dni: string, politica: boolean) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
  if (politica) cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-COB-14 Cuentas del barrio y caja de vigilancia", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-14 CA1 CA2 CA3 la directiva registra un gasto, publica la rendición y la vecina ve solo totales", () => {
    // Un cobro de la vecina nueva suma a lo que se juntó este mes.
    cy.entrarComoVecinaNueva(`Vecina Que Ve Cuentas ${sufijo}`).then(({ dni }) => {
      cy.task("reciboDePrueba", { dni, monto: 24000, medio: "YAPE_O_PLIN" });
      cy.getCookie("sesion").then((cookie) => cy.wrap(cookie!.value).as("sesionVecina"));
    });
    entrarComo("40000002", true);
    cy.task<string>("archivoDePrueba", { dni: "40000002", uso: "comprobante_egreso" }).then((archivoId) => {
      cy.intercept("POST", "/api/archivos", {
        statusCode: 201,
        body: { id: archivoId, url: R2_SIMULADO, metodo: "PUT", cabeceras: { "content-type": "image/jpeg" } },
      });
      cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
    });
    cy.viewport(360, 800);

    // DIR-TRA-03: registrar un gasto (con sus errores).
    cy.visit("/directiva/crear");
    cy.contains("a", "Registrar un ingreso o gasto").click();
    cy.get("h1").should("have.text", "Registrar un ingreso o gasto");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.contains(
      "Las cuotas de vigilancia se suman solas con cada recibo. Aquí se anota todo lo demás.",
    ).should("exist");
    cy.revisarAccesibilidad("registrar-gasto-paso1-360");
    cy.esperarHidratacion("Revisar").click();
    cy.get("#campo-monto-error").should("contain.text", "Escriba cuánto fue.");
    cy.get("#campo-concepto-error").should("contain.text", "Elija en qué se gastó.");
    cy.get("#campo-archivoId-error").should("contain.text", "Adjunte la foto del comprobante del gasto.");
    cy.revisarAccesibilidad("registrar-gasto-errores-360");
    cy.get("#campo-monto").type("35.50");
    cy.get("#campo-concepto").click();
    cy.contains("button", "Mantenimiento o reparación").click();
    cy.get("#campo-detalle").type("Foco LED para la garita");
    cy.get("#campo-archivoId").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "boleta-foco.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.contains("Foto cargada: boleta-foco.jpg").should("exist");
    cy.contains("button", "Revisar").click();

    // DIR-TRA-04: la confirmación.
    cy.get("h1").should("have.text", "¿Desea registrar este gasto?");
    cy.focused().should("match", "h1");
    cy.contains("dt", "Monto").next("dd").should("have.text", "S/ 35.50");
    cy.contains("dt", "Cuenta").next("dd").should("have.text", "Caja de vigilancia");
    cy.contains("dt", "Fecha").next("dd").should("contain.text", "Hoy,");
    cy.contains("dt", "Comprobante").next("dd").should("have.text", "boleta-foco.jpg");
    cy.contains("Si se equivoca, podrá registrar una corrección, pero no borrarlo.").should("exist");
    cy.revisarAccesibilidad("registrar-gasto-confirmar-360");
    cy.contains("button", "Sí, registrar el gasto").click();
    cy.contains('[role="status"]', "Gasto registrado").should("exist");

    // DIR-TRA-05: el movimiento queda en la lista, con su comprobante, junto a las cuotas que se suman solas.
    cy.contains("a", "Ver todos los ingresos y gastos").click();
    cy.get("h1").should("have.text", "Ingresos y gastos");
    cy.contains("article", "Cuotas de vigilancia (recibos del mes)").should(
      "contain.text",
      "Se suma solo con los recibos emitidos",
    );
    cy.contains("article", "Mantenimiento o reparación")
      .should("contain.text", "Foco LED para la garita")
      .and("contain.text", "− S/ 35.50")
      .find("a")
      .should("contain.text", "Ver el comprobante");
    cy.revisarAccesibilidad("movimientos-360");

    // DIR-TRA-01: la rendición del mes.
    cy.visit("/directiva/cuentas");
    cy.get("h1").should("contain.text", "Rendición de cuentas de");
    cy.contains("dt", "Gastos").next("dd").should("contain.text", "S/ 35.50");
    cy.contains("dt", "Gastos").parent().should("contain.text", "1 comprobante adjunto");
    cy.contains("figcaption", "En qué se gastó").should("exist");
    cy.contains("table th", "Mantenimiento o reparación").should("exist");
    cy.revisarAccesibilidad("rendicion-360");

    // DIR-TRA-02: publicar.
    cy.contains("a", "Revisar y publicar").click();
    cy.get("h1").should("have.text", "¿Desea publicar la rendición de cuentas?");
    cy.contains(
      "Los vecinos la verán en Cuentas del barrio, solo con totales. Después de publicarla no se puede modificar.",
    ).should("exist");
    cy.revisarAccesibilidad("publicar-rendicion-360");
    cy.contains("button", "Sí, publicar").click();
    cy.contains('[role="status"]', "Rendición publicada").should("exist");
    cy.visit("/directiva/cuentas");
    cy.contains('[role="status"]', "Esta rendición ya se publicó").should("exist");
    cy.contains("a", "Revisar y publicar").should("not.exist");
    // Un mes publicado ya no admite movimientos.
    cy.request({
      method: "POST",
      url: "/api/transparencia/movimientos",
      body: { tipo: "INGRESO", monto: 1000, concepto: "DONACION", idOperacion: crypto.randomUUID() },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 422);

    // VEC-TRA-01: la vecina ve totales, los gastos por concepto y nada de ninguna casa.
    cy.get<string>("@sesionVecina").then((valor) => {
      cy.clearCookies();
      cy.setCookie("sesion", valor);
    });
    cy.visit("/mas");
    cy.contains("a", "Cuentas del barrio").click();
    cy.get("h1").should("have.text", "Cuentas del barrio");
    cy.contains("Son totales del barrio: no se ve lo que paga ninguna casa.").should("exist");
    cy.contains("dt", "Se juntó").next("dd").should("contain.text", "S/ ");
    cy.contains("dt", "Se gastó").next("dd").should("contain.text", "S/ 35.50");
    cy.contains("figcaption", "Lo que se juntó cada semana").should("exist");
    cy.contains("table th", "Mantenimiento o reparación").should("exist");
    cy.contains("Se actualiza cada vez que la directiva valida un pago.").should("exist");
    cy.get("main")
      .should("not.contain.text", "Mz.")
      .and("not.contain.text", "Foco LED")
      .and("not.contain.text", "boleta-foco");
    cy.get("main a[href*='/api/archivos']").should("not.exist");
    cy.revisarAccesibilidad("cuentas-del-barrio-360");
    cy.contains("a", "Descargar las cuentas (PDF)")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect((r.body as string).slice(0, 5)).to.eq("%PDF-");
        }),
      );
  });

  it("@HU-COB-14 el mediador ve la rendición sin registrar ni publicar, en vista grande", () => {
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    entrarComo("40000003", false);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cuentas");
    cy.get("h1").should("contain.text", "Rendición de cuentas de");
    cy.contains("a", "Registrar un ingreso o gasto").should("not.exist");
    cy.contains("a", "Revisar y publicar").should("not.exist");
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en la rendición").to.be.lte(6),
    );
    cy.revisarAccesibilidad("rendicion-mediador-senior-360");
    cy.request({
      method: "POST",
      url: "/api/transparencia/rendiciones",
      body: { mes: "2026-09", idOperacion: crypto.randomUUID() },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });

  it("@HU-COB-14 la vecina las ve en vista grande con pocos objetivos y no puede pedir otra casa ni los comprobantes", () => {
    cy.entrarComoVecinaNueva(`Vecina Cuentas Senior ${sufijo}`);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/transparencia/cuentas");
    cy.get("h1").should("have.text", "Cuentas del barrio");
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en las cuentas").to.be.lte(6),
    );
    cy.revisarAccesibilidad("cuentas-del-barrio-senior-360");
    cy.request("/api/transparencia/balance-agregado?periodo=2026-09&predioId=cualquiera&dni=08123478")
      .its("body")
      .then((cuerpo) => {
        const texto = JSON.stringify(cuerpo);
        expect(texto).not.to.contain("Mz.");
        expect(texto).not.to.contain("predio");
      });
    cy.request({ url: "/directiva/cuentas", failOnStatusCode: false, followRedirect: false })
      .its("status")
      .should("not.eq", 200);
    cy.request({
      method: "POST",
      url: "/api/transparencia/movimientos",
      body: { tipo: "INGRESO", monto: 1000, concepto: "DONACION", idOperacion: crypto.randomUUID() },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });
});
