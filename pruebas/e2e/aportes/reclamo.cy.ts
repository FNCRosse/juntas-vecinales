export {};

// Reclamo sobre mi cuota (VEC-COB-08 a VEC-COB-11; HU-COB-03). Cada prueba empadrona a una vecina nueva y le emite sus tres
// semanas. El CI no habla con R2: la subida del documento se simula y el archivo «subido» se crea en la BD de pruebas.

const sufijo = String(Date.now()).slice(-6);
const R2_SIMULADO = "https://r2-simulado.invalid/sustento-reclamo";
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

function vecinaConCuotas(nombre: string) {
  return cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
    });
    return cy.wrap(dni);
  });
}

describe("@HU-COB-03 Reclamo sobre mi cuota", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-03 CA1 CA2 CA3 la casa reclama con un motivo y un documento, la cuota queda en revisión y no puede hacer otro reclamo", () => {
    const nombre = `Vecina Que Reclama ${sufijo}`;
    vecinaConCuotas(nombre).then((dni) => {
      cy.task<string>("archivoDePrueba", { dni, uso: "sustento_reclamo" }).then((archivoId) => {
        cy.intercept("POST", "/api/archivos", {
          statusCode: 201,
          body: {
            id: archivoId,
            url: R2_SIMULADO,
            metodo: "PUT",
            cabeceras: { "content-type": "application/pdf" },
          },
        });
        cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
      });
    });
    cy.viewport(360, 800);
    cy.visit("/cuota");
    cy.contains("¿Cree que el monto no es correcto?").should("exist");
    cy.contains("a", "Hacer un reclamo").click();

    // VEC-COB-08: el formulario.
    cy.get("h1").should("have.text", "Reclamo sobre mi cuota");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.contains("Cuota que reclama: S/ 2.50 por semana (casa). Ya tenemos sus datos.").should("exist");
    cy.revisarAccesibilidad("reclamo-paso1-360");
    cy.esperarHidratacion("Revisar mi reclamo").click();
    cy.get("#campo-motivo-error").should("contain.text", "Elija por qué cree que su cuota no es correcta.");
    cy.revisarAccesibilidad("reclamo-errores-360");
    cy.contains("button", "Elegir el motivo").click();
    for (const m of [
      "Ya no tengo inquilino",
      "Tengo menos autos o motos de lo que figura",
      "Ya pagué y no aparece",
      "Otro motivo",
    ]) {
      cy.contains("button", m).should("exist");
    }
    cy.contains("button", "Otro motivo").click();
    cy.contains("button", "Revisar mi reclamo").click();
    cy.get("#campo-detalle-error").should("contain.text", "Cuéntenos cuál es el motivo.");
    cy.contains("button", "Otro motivo").click();
    cy.contains("button", "Ya pagué y no aparece").click();
    cy.get("#campo-detalle").type("Pagué el lunes por Yape");
    cy.get("#campo-archivoId").selectFile({
      contents: Cypress.Buffer.from("pdf"),
      fileName: "recibo.pdf",
      mimeType: "application/pdf",
    });
    cy.wait("@subir");
    cy.contains("Documento cargado: recibo.pdf").should("exist");
    cy.contains("button", "Revisar mi reclamo").click();

    // VEC-COB-09: la confirmación.
    cy.get("h1").should("have.text", "¿Desea enviar este reclamo?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "S/ 2.50 por semana").should("exist");
    cy.contains("dd", "Ya pagué y no aparece").should("exist");
    cy.contains("dd", "recibo.pdf").should("exist");
    cy.contains("Mientras tanto no tiene que pagar la diferencia que reclama.").should("exist");
    cy.revisarAccesibilidad("reclamo-confirmar-360");
    cy.contains("button", "Sí, enviar mi reclamo").click();

    // VEC-COB-10: el reclamo enviado.
    cy.get("h1").should("have.text", "Su reclamo está en revisión");
    cy.contains('[role="status"]', "Enviado el").should("contain.text", "Avisamos a la directiva.");
    cy.contains("Reclamo N.° R-").should("exist");
    cy.contains("Ya pagué y no aparece").should("exist");
    cy.contains("Su cuota figura como en reclamo hasta que la directiva responda.").should("exist");
    cy.revisarAccesibilidad("reclamo-enviado-360");
    cy.contains("a", "Descargar constancia (PDF)")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect((r.body as string).slice(0, 5)).to.eq("%PDF-");
        }),
      );

    // CA2: la cuota figura en revisión en Mi cuota.
    cy.contains("a", "Volver a Mi cuota").click();
    cy.contains('[role="status"]', "Su reclamo está en revisión").should("exist");
    cy.contains("article", "Semana del 7 al 13 de setiembre").should("contain.text", "En revisión");
    cy.contains("a", "Ver mi reclamo").should("exist");
    cy.revisarAccesibilidad("cuota-con-reclamo-360");

    // CA3 y VEC-COB-11: no puede hacer otro mientras tanto.
    cy.visit("/cuota/reclamo");
    cy.get("h1").should("have.text", "Ya tiene un reclamo en revisión");
    cy.contains("Para no mezclar respuestas, esperamos a que la directiva conteste.").should("exist");
    cy.revisarAccesibilidad("reclamo-ya-tiene-360");
    cy.contains("a", "Ver mi reclamo").click();
    cy.get("h1").should("have.text", "Su reclamo está en revisión");
  });

  it("@HU-COB-03 AC-7 y vista grande: otra casa no abre el reclamo, y el formulario tiene pocos objetivos", () => {
    const nombre = `Vecina Reclamo Senior ${sufijo}`;
    vecinaConCuotas(nombre);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/cuota/reclamo");
    cy.get("h1").should("have.text", "Reclamo sobre mi cuota");
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en el reclamo").to.be.lte(6),
    );
    cy.revisarAccesibilidad("reclamo-senior-360");
    cy.request("POST", "/api/aportes/ajustes", {
      motivo: "SIN_INQUILINO",
      idOperacion: crypto.randomUUID(),
    }).then((r) => {
      expect(r.status).to.eq(201);
      const id = r.body.id as string;
      cy.visit(`/cuota/reclamo/${id}`);
      cy.get("h1").should("have.text", "Su reclamo está en revisión");
      cy.revisarAccesibilidad("reclamo-enviado-senior-360");
      vecinaConCuotas(`Otra Vecina Reclamo ${sufijo}`);
      cy.request({ url: `/cuota/reclamo/${id}`, failOnStatusCode: false })
        .its("status")
        .should("eq", 404);
      cy.request({ url: `/api/aportes/ajustes/${id}/constancia`, failOnStatusCode: false })
        .its("status")
        .should("eq", 404);
    });
  });
});
