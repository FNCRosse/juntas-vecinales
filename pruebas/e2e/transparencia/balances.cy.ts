export {};

// Balance de una actividad pro fondos (DIR-ASA-12, DIR-ASA-13) y su vista para el vecino (VEC-TRA-03).
// El CI no habla con R2: la subida de la foto se simula y el archivo "subido" se crea en la BD de pruebas.

const sufijo = String(Date.now()).slice(-6);
const TITULO = `Pollada pro fondos ${sufijo}`;
const R2_SIMULADO = "https://r2-simulado.invalid/comprobante";

describe("@HU-ASA-10 Balance de ingresos y egresos de actividades pro fondos", () => {
  // Sin actividades de la plataforma el formulario pide el nombre y la fecha, como en los balances de antes.
  before(() => cy.task("reiniciarAsambleas"));
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
      .its("status")
      .should("eq", 200);
    cy.request("POST", "/api/auth/politica", { acepto: true });
  });

  it("@HU-ASA-10 CA1 CA2 CA3 la directiva registra ingresos y un gasto con su foto, ve el gráfico y publica en teléfono", () => {
    cy.task<string>("archivoDePrueba", { dni: "40000002" }).then((archivoId) => {
      cy.intercept("POST", "/api/archivos", {
        statusCode: 201,
        body: { id: archivoId, url: R2_SIMULADO, metodo: "PUT", cabeceras: { "content-type": "image/jpeg" } },
      }).as("pedirSubida");
      cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
    });
    cy.viewport(360, 800);
    cy.visit("/directiva/crear");
    cy.contains("a", "Publicar un balance").click();
    cy.get("h1").should("have.text", "Balance de una actividad");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("balance-registrar-360");

    cy.esperarHidratacion("Revisar el balance").click();
    cy.get("#campo-titulo-error").should("contain.text", "Escriba el nombre de la actividad.");
    cy.get("#campo-fechaActividad-error").should("contain.text", "Elija la fecha de la actividad.");
    cy.contains('[role="status"], [role="alert"]', "Registre al menos un ingreso o un gasto.").should(
      "exist",
    );
    cy.revisarAccesibilidad("balance-errores-360");

    cy.get("#campo-titulo").type(TITULO);
    cy.get("#campo-fechaActividad").type("2026-09-26");
    cy.get("#campo-ingresosVirtuales").type("1200.50");
    cy.get("#campo-ingresosEnPuerta").type("800");
    cy.contains("button", "Agregar un gasto").click();
    cy.get("#campo-gasto-0-concepto").type("Pollos y papas");
    cy.get("#campo-gasto-0-monto").type("900");
    cy.contains("button", "Revisar el balance").click();
    cy.get("#campo-gasto-0-archivoId-error").should("contain.text", "Adjunte la foto del comprobante");

    cy.get("#campo-gasto-0-archivoId").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "recibo.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.contains("Foto cargada: recibo.jpg").should("exist");
    cy.contains("table th", "Utilidad neta").parent().should("contain.text", "S/ 1,100.50");
    cy.revisarAccesibilidad("balance-con-gasto-360");
    cy.contains("button", "Revisar el balance").click();

    cy.get("h1").should("have.text", "¿Desea publicar el balance?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "S/ 2,000.50").should("exist");
    cy.revisarAccesibilidad("balance-confirmar-360");
    cy.contains("button", "Sí, publicar el balance").click();

    cy.contains('[role="status"]', "Balance publicado").should("exist");
    cy.get("h1").should("have.text", TITULO);
    cy.contains("table th", "Utilidad neta").parent().should("contain.text", "S/ 1,100.50");
    cy.revisarAccesibilidad("balance-publicado-360");
  });

  it("@HU-ASA-10 el balance se enlaza con la actividad pro fondos que ya se hizo y toma su nombre y su fecha", () => {
    const nombre = `Bingo enlazado ${sufijo}`;
    cy.request("POST", "/api/eventos", {
      tipoActividad: "BINGO",
      nombre,
      paraQue: "Comprar sillas para el local comunal",
      fecha: new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10),
      hora: "17:00",
      lugar: "Local comunal",
      precio: "10",
      meta: "",
      pagos: "AMBOS",
      pideVoluntarios: false,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.task("empezarAsambleas", { padronTotal: 1, quorumRequerido: 1 });
    cy.viewport(360, 800);
    cy.visit("/directiva/balances/nuevo");
    cy.contains("button", "Elegir la actividad").click();
    cy.contains("button", nombre).click();
    cy.get("#campo-titulo").should("not.exist");
    cy.get("#campo-fechaActividad").should("not.exist");
    cy.get("#campo-ingresosVirtuales").type("100");
    cy.get("#campo-ingresosEnPuerta").type("50");
    cy.contains("button", "Revisar el balance").click();
    cy.get("h1").should("have.text", "¿Desea publicar el balance?");
    cy.contains("dd", nombre).should("exist");
    cy.contains("button", "Sí, publicar el balance").click();
    cy.contains('[role="status"]', "Balance publicado").should("exist");
    cy.get("h1").should("have.text", nombre);
    cy.revisarAccesibilidad("balance-enlazado-360");
  });

  it("@HU-ASA-10 CA2 CA3 en modo Senior el vecino ve el balance publicado con su gráfico y su tabla", () => {
    cy.task<string>("archivoDePrueba", { dni: "40000002" }).then((archivoId) =>
      cy
        .request("POST", "/api/transparencia/balances", {
          titulo: `${TITULO} (vecino)`,
          fechaActividad: "2026-09-19",
          ingresosVirtuales: 50000,
          ingresosEnPuerta: 25000,
          egresos: [{ concepto: "Sonido", monto: 30000, archivoId }],
          idOperacion: crypto.randomUUID(),
        })
        .then((r) => {
          expect(r.status).to.eq(201);
          cy.viewport(360, 800);
          cy.guardarModo("senior");
          cy.visit("/transparencia");
          // Con más balances publicados, la vista grande deja los demás detrás de «Ver más» (R-11).
          cy.verTodos();
          cy.contains("article", `${TITULO} (vecino)`)
            .should("contain.text", "Saldo final")
            .and("contain.text", "S/ 450.00");
          cy.revisarAccesibilidad("transparencia-balances-senior-360");
          cy.contains("article", `${TITULO} (vecino)`).contains("a", "Ver el balance").click();
          cy.location("pathname").should("eq", `/transparencia/balances/${r.body.id}`);
          cy.get("h1").should("have.text", `${TITULO} (vecino)`);
          cy.contains("table th", "Utilidad neta").parent().should("contain.text", "S/ 450.00");
          cy.contains("li", "Sonido").should("contain.text", "S/ 300.00");
          cy.revisarAccesibilidad("balance-vecino-senior-360");
        }),
    );
  });
});
