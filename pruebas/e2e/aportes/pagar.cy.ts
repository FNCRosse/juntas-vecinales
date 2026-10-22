export {};

// Pagar mi cuota (VEC-COB-02 a VEC-COB-04, HU-COB-08) y Cobros: comprobantes por revisar (DIR-COB-01).
// El CI no habla con R2: la subida de la foto se simula y el archivo «subido» se crea en la BD de pruebas.

const R2_SIMULADO = "https://r2-simulado.invalid/comprobante-pago";
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];

describe("@HU-COB-08 Pagar mi cuota", () => {
  it("@HU-COB-08 CA1 CA2 la vecina elige cuánto y cómo paga, sube su comprobante, lo revisa y lo envía con su constancia", () => {
    cy.entrarComoVecinaNueva("Vecina Pagadora").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
      });
      cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) => {
        cy.intercept("POST", "/api/archivos", {
          statusCode: 201,
          body: {
            id: archivoId,
            url: R2_SIMULADO,
            metodo: "PUT",
            cabeceras: { "content-type": "image/jpeg" },
          },
        }).as("pedirSubida");
        cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
      });
    });
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.contains("a", "Pagar mi cuota").click();
    cy.get("h1").should("have.text", "Pagar mi cuota");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.contains("Yape o Plin: 987 654 321").should("exist");
    cy.revisarAccesibilidad("pagar-paso1-360");

    cy.esperarHidratacion("Revisar mi pago").click();
    cy.get("#campo-semanas-error").should("contain.text", "Elija cuánto va a pagar.");
    cy.get("#campo-medio-error").should("contain.text", "Elija cómo va a pagar.");
    cy.get("#campo-archivoId-error").should("contain.text", "Falta la foto de su comprobante");
    cy.revisarAccesibilidad("pagar-errores-360");

    cy.contains("button", "Elegir cuánto").click();
    cy.contains("button", "Todo lo pendiente").click();
    cy.contains("button", "Elegir cómo").click();
    cy.contains("button", "Yape o Plin").click();
    cy.get("#campo-archivoId").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "recibo.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.contains("Foto cargada: recibo.jpg").should("exist");
    cy.contains("button", "Revisar mi pago").click();

    cy.get("h1").should("have.text", "¿Desea enviar este pago?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "S/ 7.50").should("exist");
    cy.contains("dd", "recibo.jpg").should("exist");
    cy.revisarAccesibilidad("pagar-confirmar-360");
    cy.contains("button", "Sí, enviar mi pago").click();

    cy.get("h1").should("have.text", "Recibimos su pago");
    cy.contains('[role="status"]', "Enviado el").should("exist");
    cy.contains("Constancia de envío N.° E-").should("exist");
    cy.contains("Pendiente de revisión").should("exist");
    cy.revisarAccesibilidad("pagar-enviado-360");
    cy.contains("a", "Descargar constancia (PDF)")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect((r.body as string).slice(0, 5)).to.eq("%PDF-");
        }),
      );

    // Mi cuota lo dice y ya no hay nada más por pagar; Mis pagos lo lista.
    cy.visit("/cuota");
    cy.contains('[role="status"]', "Su pago de S/ 7.50 está en revisión").should("exist");
    cy.contains("article", "Semana del 7 al 13 de setiembre").should("contain.text", "Pago en revisión");
    cy.contains("a", "Pagar mi cuota").should("not.exist");
    cy.revisarAccesibilidad("cuota-pago-en-revision-360");
    cy.visit("/cuota/pagos");
    cy.contains("article", "Pago del")
      .should("contain.text", "En revisión")
      .and("contain.text", "Yape o Plin");
    cy.revisarAccesibilidad("pagos-con-pago-en-revision-360");
  });

  it("@HU-COB-08 CA1 con una semana ya enviada, lo que sigue disponible es el resto", () => {
    cy.entrarComoVecinaNueva("Vecina Parcial").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
      });
      cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) =>
        cy
          .request("POST", "/api/aportes/pagos/digital", {
            semanas: 1,
            medio: "TRANSFERENCIA",
            archivoId,
            idOperacion: crypto.randomUUID(),
          })
          .its("status")
          .should("eq", 201),
      );
    });
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.contains("a", "Pagar mi cuota").click();
    cy.contains("button", "Elegir cuánto").click();
    cy.contains("button", "Todo lo pendiente: S/ 5.00").should(
      "contain.text",
      "2 semanas, del 14 al 27 de setiembre",
    );
  });

  it("@HU-COB-08 CA1 sin semanas por pagar no hay nada que enviar", () => {
    cy.entrarComoVecinaNueva("Vecina Al Dia");
    cy.viewport(360, 800);
    cy.visit("/cuota/pagar");
    cy.get("h1").should("have.text", "Pagar mi cuota");
    cy.contains("No hay nada por pagar ahora").should("exist");
    cy.revisarAccesibilidad("pagar-nada-por-pagar-360");
  });

  it("@HU-COB-08 CA1 en modo Senior, pagar se lee igual y cabe en la pantalla", () => {
    cy.entrarComoVecinaNueva("Vecina Senior Pagos").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [{ periodo: SEMANAS[0], estado: "PENDIENTE", lineas: [CASA] }],
      });
    });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/cuota/pagar");
    cy.get("h1").should("have.text", "Pagar mi cuota");
    cy.document().then((d) => expect(d.documentElement.scrollWidth).to.be.lte(360));
    cy.revisarAccesibilidad("pagar-paso1-senior-360");
  });
});

describe("@HU-COB-08 CA3 Cobros: comprobantes por revisar", () => {
  it("@HU-COB-08 CA3 la directiva recibe el aviso y ve el comprobante en Cobros, con lo que debía la casa", () => {
    cy.entrarComoVecinaNueva("Vecina Del Aviso").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
      });
      cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) =>
        cy
          .request("POST", "/api/aportes/pagos/digital", {
            semanas: 1,
            medio: "YAPE_O_PLIN",
            archivoId,
            idOperacion: crypto.randomUUID(),
          })
          .its("status")
          .should("eq", 201),
      );
    });
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.task("copiaInternaDeLaCola", { dni: "40000002" });
    cy.viewport(360, 800);
    cy.visit("/directiva/alertas");
    cy.contains("h2", "Llegó un comprobante de pago").should("exist");

    cy.visit("/directiva/cobros");
    cy.get("h1").should("have.text", "Cobros");
    cy.contains("article", "Vecina Del Aviso")
      .should("contain.text", "Comprobante digital · Yape o Plin")
      .and("contain.text", "Debía S/ 7.50")
      .and("contain.text", "pago parcial")
      .and("contain.text", "S/ 2.50");
    cy.revisarAccesibilidad("cobros-comprobantes-360");
    cy.guardarModo("senior");
    cy.visit("/directiva/cobros");
    cy.contains("h1", "Cobros").should("exist");
    cy.revisarAccesibilidad("cobros-comprobantes-senior-360");
  });
});
