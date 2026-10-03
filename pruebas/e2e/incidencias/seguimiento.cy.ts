export {};

// Seguimiento por código sin sesión (VEC-QUE-09) y avance desde Mis reportes (VEC-QUE-08).

describe("@HU-QUE-09 Seguimiento por código", () => {
  it("@HU-QUE-09 CA1 CA3 la vecina ve el avance desde Mis reportes y, sin sesión, con su código", () => {
    cy.entrarComoVecinaNueva("Lidia Paz Torres").then(({ dni }) => {
      cy.task<string>("archivoDePrueba", { dni, uso: "evidencia_queja" }).then((archivoId) => {
        cy.request("POST", "/api/quejas", {
          categoria: "BASURA",
          descripcion: "Bolsas de basura en la esquina",
          manzana: "F",
          referencia: "la esquina",
          evidencias: [archivoId],
          consentimiento: true,
          esAnonimo: true,
          idOperacion: crypto.randomUUID(),
        }).then(({ body }) => cy.wrap(body.codigo as string).as("codigo"));
      });
    });
    cy.viewport(360, 800);
    cy.visit("/incidentes");
    cy.contains("a", "Basura").click();
    cy.get("h1").should("contain.text", "Reporte N.°");
    cy.contains("li", "2. En revisión").should("contain.text", "Sigue ahora");
    cy.revisarAccesibilidad("avance-mi-reporte-360");

    cy.clearCookies();
    cy.guardarModo("senior");
    cy.visit("/seguimiento");
    cy.get("h1").should("have.text", "Buscar con mi código");
    cy.esperarHidratacion("Buscar mi reporte").click();
    cy.get("#campo-codigo-error").should("contain.text", "Escriba el código");
    cy.get("#campo-codigo").type("Q-2026-99999-ZZZZ");
    cy.contains("button", "Buscar mi reporte").click();
    cy.get("#campo-codigo-error").should("contain.text", "No encontramos un reporte con ese código");
    cy.revisarAccesibilidad("seguimiento-no-encontrado-senior-360");
    cy.get<string>("@codigo").then((codigo) => {
      cy.get("#campo-codigo").clear().type(codigo.toLowerCase());
    });
    cy.contains("button", "Buscar mi reporte").click();
    cy.contains("h2", "Reporte N.°").should("exist");
    cy.contains("Basura · Mz. F").should("exist");
    cy.get("main").should("not.contain.text", "Lidia").and("not.contain.text", "la esquina");
    cy.revisarAccesibilidad("seguimiento-encontrado-senior-360");
    cy.guardarModo("normal");
  });
});
