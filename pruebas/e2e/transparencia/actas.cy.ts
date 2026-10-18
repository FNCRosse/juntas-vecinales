export {};

// Acta de la asamblea (DIR-ASA-10, DIR-ASA-11) y Actas y balances (VEC-TRA-02). Marta es directiva y
// vecina, así que una sola sesión publica y lee.

const sufijo = String(Date.now()).slice(-6);
const TITULO = `Asamblea de prueba ${sufijo}`;
const TITULO_ENLAZADA = `Acta enlazada ${sufijo}`;
const TITULO_VECINO = `Asamblea para el vecino ${sufijo}`;

describe("@HU-ASA-11 Acta digital en PDF y su publicación", () => {
  // Sin asambleas de la plataforma el formulario pide la fecha, como en las actas de antes.
  before(() => cy.task("reiniciarAsambleas"));
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
      .its("status")
      .should("eq", 200);
    cy.request("POST", "/api/auth/politica", { acepto: true });
  });

  it("@HU-ASA-11 CA1 CA2 CA3 la directiva redacta, ve el PDF, revisa y publica el acta en teléfono", () => {
    cy.viewport(360, 800);
    cy.visit("/directiva/crear");
    cy.contains("a", "Publicar un acta").click();
    cy.get("h1").should("have.text", "Acta de la asamblea");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("acta-redactar-360");

    cy.esperarHidratacion("Revisar el acta").click();
    cy.get("#campo-titulo-error").should("contain.text", "Escriba el título del acta.");
    cy.get("#campo-fechaAsamblea-error").should("contain.text", "Elija la fecha de la asamblea.");
    cy.get("#campo-acuerdos-error").should("contain.text", "Escriba al menos un acuerdo");
    cy.revisarAccesibilidad("acta-errores-360");

    cy.get("#campo-titulo").type(TITULO);
    cy.get("#campo-fechaAsamblea").type("2026-09-26");
    cy.get("#campo-acuerdos").type("Se aprobó la cuota de vigilancia.{enter}Se aprobó el cierre del parque.");
    cy.get("#campo-compromisos").type("La directiva presenta el balance en 15 días.");
    cy.get("#campo-conclusiones").type("Asistieron 84 familias.");
    cy.contains("button", "Ver cómo queda el PDF").click();
    cy.contains("a", "Abrir la vista previa")
      .should("have.attr", "href")
      .and("match", /^blob:/);
    cy.contains("button", "Revisar el acta").click();

    cy.get("h1").should("have.text", "¿Desea publicar el acta?");
    cy.focused().should("match", "h1");
    cy.contains("dd", TITULO).should("exist");
    cy.contains("dd", "26/09/2026").should("exist");
    cy.revisarAccesibilidad("acta-confirmar-360");
    cy.contains("button", "Sí, publicar el acta").click();

    cy.contains('[role="status"]', "Acta publicada").should("exist");
    cy.get("h1").should("have.text", TITULO);
    cy.revisarAccesibilidad("acta-publicada-360");
  });

  it("@HU-ASA-11 @HU-ASA-07 CA3 el acta de una asamblea se enlaza con ella y, sin quórum definitivo, no admite acuerdos", () => {
    cy.task("reiniciarAsambleas");
    const enDias = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(40),
      hora: "18:00",
      lugar: "Local comunal",
      motivo: "Aprobar el presupuesto.",
      idOperacion: crypto.randomUUID(),
    }).then(({ body }) => {
      // La asamblea ya empezó, pero todavía no se hizo el pase de lista.
      cy.task("empezarAsambleas", { padronTotal: 1, quorumRequerido: 1 });
      cy.viewport(360, 800);
      cy.visit("/directiva/actas/nueva");
      cy.contains("button", "Elegir la asamblea").click();
      cy.contains("button", "Sin quórum definitivo").should("exist");
      cy.contains("button", "Asamblea ordinaria").click();
      cy.get("#campo-titulo").type(TITULO_ENLAZADA);
      cy.get("#campo-acuerdos").type("Se aprobó el presupuesto.");
      cy.contains("button", "Revisar el acta").click();
      cy.get("#campo-convocatoria-error").should("contain.text", "no tiene el quórum definitivo");
      cy.revisarAccesibilidad("acta-sin-quorum-360");

      // Con el pase de lista y las votaciones abiertas, la asamblea admite el acta.
      cy.request("GET", `/api/asambleas/${body.id}/checkin?q=40000002`)
        .its("body.0.predioId")
        .then((predioId) =>
          cy
            .request("POST", `/api/asambleas/${body.id}/checkin`, { predioId })
            .its("status")
            .should("eq", 200),
        );
      cy.request("POST", `/api/asambleas/${body.id}/votaciones`).its("status").should("eq", 200);
      cy.visit("/directiva/actas/nueva");
      cy.contains("button", "Elegir la asamblea").click();
      cy.contains("button", "Sin quórum definitivo").should("not.exist");
      cy.contains("button", "Asamblea ordinaria").click();
      cy.get("#campo-fechaAsamblea").should("not.exist");
      cy.get("#campo-titulo").type(TITULO_ENLAZADA);
      cy.get("#campo-acuerdos").type("Se aprobó el presupuesto.");
      cy.contains("button", "Revisar el acta").click();
      cy.get("h1").should("have.text", "¿Desea publicar el acta?");
      cy.contains("button", "Sí, publicar el acta").click();
      cy.contains('[role="status"]', "Acta publicada").should("exist");
      cy.revisarAccesibilidad("acta-enlazada-360");
    });
  });

  it("@HU-ASA-11 CA2 CA3 en modo Senior el vecino ve el acta publicada y descarga su PDF", () => {
    cy.request("POST", "/api/transparencia/actas", {
      titulo: TITULO_VECINO,
      fechaAsamblea: "2026-09-19",
      acuerdos: "Se aprobó la limpieza del parque.",
      compromisos: "",
      conclusiones: "",
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/transparencia");
    cy.get("h1").should("have.text", "Actas y balances");
    cy.verTodos();
    cy.contains("article", TITULO_VECINO).within(() => {
      cy.contains("p", "Acuerdo").should("contain.text", "Se aprobó la limpieza del parque.");
      cy.contains("a", "Descargar acta (PDF)")
        .should("have.attr", "href")
        .and("match", /\/pdf$/);
    });
    cy.revisarAccesibilidad("actas-senior-360");

    cy.contains("article", TITULO_VECINO)
      .contains("a", "Descargar acta (PDF)")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect((r.body as string).slice(0, 5)).to.eq("%PDF-");
        }),
      );
  });
});
