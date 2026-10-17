export {};

// HU-ASA-01: convocatoria con versión imprimible (DIR-ASA-01 a DIR-ASA-04, VEC-ASA-01).
// Marta es directiva y vecina, así que una sola sesión convoca y luego ve la asamblea como vecina.

const sufijo = String(Date.now()).slice(-6);
// Fechas siempre a futuro: la asamblea debe ser posterior a hoy, así que se cuentan desde hoy.
const enDias = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const LUGAR = `Local comunal ${sufijo}`;
const MOTIVO = "Aprobar el presupuesto para cámaras de seguridad en las entradas del barrio.";

const entrarComoMarta = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
    .its("status")
    .should("eq", 200);
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-ASA-01 Convocatoria con versión imprimible", () => {
  beforeEach(entrarComoMarta);

  it("@HU-ASA-01 CA1 CA2 CA3 la directiva convoca, revisa y publica el afiche en teléfono", () => {
    cy.viewport(360, 800);
    cy.visit("/directiva/asambleas");
    cy.get("h1").should("have.text", "Asambleas y actividades");
    cy.revisarAccesibilidad("asambleas-directiva-360");

    cy.contains("a", "Convocar una asamblea").click();
    cy.get("h1").should("have.text", "Nueva convocatoria");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("convocatoria-nueva-360");

    cy.esperarHidratacion("Revisar la convocatoria").click();
    cy.contains("Elija si la asamblea es ordinaria o extraordinaria.").should("exist");
    cy.contains("Escriba el lugar de la asamblea.").should("exist");
    cy.contains("Escriba el motivo de la asamblea.").should("exist");
    cy.revisarAccesibilidad("convocatoria-errores-360");

    cy.contains("button", "Elegir el tipo").click();
    cy.contains("button", "Ordinaria").click();
    cy.contains("button", "Elegir fecha y hora").click();
    cy.get("#campo-fecha-fecha").type(enDias(60));
    cy.get("#campo-fecha-hora").type("18:00");
    cy.contains("button", "Listo").click();
    cy.get("#campo-lugar").type(LUGAR);
    cy.get("#campo-motivo").type(MOTIVO);
    cy.contains("button", "Revisar la convocatoria").click();

    cy.get("h1").should("have.text", "¿Desea publicar la convocatoria?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "Asamblea ordinaria").should("exist");
    cy.contains("dd", LUGAR).should("exist");
    cy.revisarAccesibilidad("convocatoria-confirmar-360");
    cy.contains("button", "Sí, publicar la convocatoria").click();

    cy.contains('[role="status"]', "Convocatoria publicada").should("exist");
    cy.get("h1").should("have.text", "Afiche para pegar en el barrio");
    cy.contains("Asamblea ordinaria").should("exist");
    cy.contains(MOTIVO).should("exist");
    cy.contains("a", "Descargar en PDF")
      .should("have.attr", "href")
      .and("match", /\/api\/asambleas\/.+\/afiche/);
    cy.revisarAccesibilidad("convocatoria-publicada-360");
  });

  it("@HU-ASA-01 CA1 en modo Senior el vecino ve la asamblea convocada y su quórum", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(61),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/asambleas");
    cy.get("h1").should("have.text", "Asambleas");
    cy.contains("h2", "Asamblea ordinaria").should("exist");
    cy.contains(MOTIVO).should("exist");
    cy.contains("¿Cuántos van?").should("exist");
    cy.contains("casas").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-senior-360");
  });

  it("@HU-ASA-02 CA1 CA3 el vecino confirma su asistencia y puede cambiar la respuesta", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(62),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);

    cy.visit("/asambleas");
    cy.esperarHidratacion("Sí, asistiré").click();
    cy.contains("Usted confirmó que asistirá").should("exist");
    cy.contains("1 de").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-confirmado-360");

    cy.contains("button", "Cambiar mi respuesta: ya no podré ir").click();
    cy.contains("button", "Sí, asistiré").should("exist");
  });

  it("@HU-ASA-04 CA2 la directiva ve el quórum proyectado con la barra y si alcanza el mínimo", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(64),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/directiva/asambleas");
    cy.contains("h3", "Quórum proyectado").should("exist");
    cy.get('[role="img"][aria-label^="Barra de quórum"]').should("exist");
    cy.contains(/Falta(n)? \d+ casas? para el mínimo/).should("exist");
    cy.contains("Todavía no alcanza el quórum").should("exist");
    cy.contains("Confirmaron en la app").should("exist");
    cy.revisarAccesibilidad("quorum-directiva-senior-360");
  });

  it("@HU-ASA-03 CA1 CA2 CA3 el mediador busca a un vecino y asienta su asistencia", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(63),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.viewport(360, 800);

    cy.visit("/directiva/asambleas/asistencia");
    cy.get("h1").should("have.text", "Registrar la asistencia de un vecino");
    cy.get("#campo-buscar").type("Carmen");
    cy.contains("button", "Buscar").click();
    cy.contains("li", "terminado en 78").should("exist");
    cy.revisarAccesibilidad("asistencia-mediador-buscar-360");

    cy.contains("button", "Registrar que asistirá").click();
    cy.contains("Asistirá · gestionado en persona").should("exist");
    cy.revisarAccesibilidad("asistencia-mediador-registrada-360");

    cy.contains("button", "Anular este registro").click();
    cy.contains("Todavía no confirma").should("exist");
  });
});
