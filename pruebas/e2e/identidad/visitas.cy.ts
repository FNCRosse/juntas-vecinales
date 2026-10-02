export {};

// Mis visitas (VEC-GAR-01 a 04). Marta es vecina de Mz. A, lote 12 en las semillas.

const manana = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(
  new Date(Date.now() + 24 * 3_600_000),
);
const NOMBRE = `Rosa Huamán ${String(Date.now()).slice(-4)}`;

describe("@HU-GAR-04 @HU-GAR-05 Visitas de la vecina", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
  });

  it("@HU-GAR-04 CA1 CA3 @HU-GAR-05 CA1 CA2 CA3 registra una visita, la ve en la lista y la anula", () => {
    cy.visit("/mas");
    cy.contains("a", "Mis visitas").click();
    cy.get("h1").should("have.text", "Mis visitas");
    cy.revisarAccesibilidad("mis-visitas-normal");
    cy.contains("a", "Registrar una visita").click();

    cy.esperarHidratacion("Registrar la visita").click();
    cy.get("#campo-nombre-error").should("have.text", "Falta el nombre de la visita.");
    cy.focused().should("have.attr", "role", "alert");
    cy.get("#campo-nombre").type(NOMBRE);
    cy.get("#campo-fecha").type(manana);
    cy.get("#campo-hora").type("16:30");
    cy.contains("label", "Sí, viene en auto o moto").click();
    cy.get("#campo-placa").type("abc123");
    cy.revisarAccesibilidad("registrar-visita-normal");
    cy.contains("button", "Registrar la visita").click();

    cy.get("h1").should("have.text", `${NOMBRE} puede entrar`);
    cy.contains("section", "Constancia de visita N.° V-").should(
      "contain.text",
      "de 4:30 p. m. a 7:30 p. m.",
    );
    cy.contains("section", "Auto ABC-123 · a Mz. A, lote 12").should("exist");
    cy.revisarAccesibilidad("visita-registrada-normal");
    cy.contains("a", "Volver a Mis visitas").click();

    cy.contains("li", NOMBRE)
      .should("contain.text", "En la lista de la garita")
      .contains("a", "Anular esta visita")
      .click();
    cy.get("h1").should("have.text", `¿Desea anular la visita de ${NOMBRE}?`);
    cy.revisarAccesibilidad("anular-visita-normal");
    cy.esperarHidratacion("Sí, anular la visita").click();
    cy.contains('[role="status"]', `Anulamos la visita de ${NOMBRE}`).should("exist");
    cy.contains("li", NOMBRE).should("not.exist");
  });

  it("@HU-GAR-04 en modo Senior el formulario cumple WCAG 2.2 AA", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/visitas/nueva");
    cy.esperarHidratacion("Registrar la visita").click();
    cy.get("#campo-nombre-error").should("exist");
    cy.revisarAccesibilidad("registrar-visita-senior-360");
  });
});
