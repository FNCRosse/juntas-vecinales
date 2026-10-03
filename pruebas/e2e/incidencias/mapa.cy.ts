export {};

// Incidentes del barrio como lista, mapa y resumen (VEC-QUE-01, 02, 03), con su alternativa en texto.
// Marta es de la directiva y también vecina: reporta, admite su reporte y lo ve en el mapa.

describe("@HU-QUE-08 @HU-ACC-07 Mapa de incidentes", () => {
  it("@HU-QUE-08 CA1 CA2 CA3 @HU-ACC-07 CA1 CA2 CA3 el reporte admitido aparece por manzana en la lista, el mapa y la tabla", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.task<string>("archivoDePrueba", { dni: "40000002", uso: "evidencia_queja" }).then((archivoId) =>
      cy
        .request("POST", "/api/quejas", {
          categoria: "COCHERAS",
          descripcion: "Un auto tapa la cochera",
          manzana: "B",
          referencia: "frente al lote 5",
          evidencias: [archivoId],
          consentimiento: true,
          idOperacion: crypto.randomUUID(),
        })
        .then(({ body }) =>
          cy.request("PATCH", `/api/quejas/${body.id}/admisibilidad`, {
            decision: "admitir",
            prioridad: "MEDIA",
          }),
        ),
    );
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/incidentes");
    cy.get('nav[aria-label="Ver incidentes como"] a[aria-current="true"]').should("contain.text", "Lista");
    cy.contains("li", "Cocheras o autos mal estacionados").should("contain.text", "Mz. B");
    cy.get("main").should("not.contain.text", "lote 5");
    cy.revisarAccesibilidad("incidentes-lista-senior-360");

    cy.contains("a", "Mapa").click();
    cy.location("search").should("eq", "?vista=mapa");
    cy.get('[role="img"]')
      .should("have.attr", "aria-label")
      .and("contain", "Mz. B:")
      .and("contain", "de cocheras");
    cy.contains("figcaption", "Descripción del mapa:").should("exist");
    cy.get('[role="img"] svg').each(($svg) => expect($svg.attr("aria-hidden")).to.eq("true"));
    cy.revisarAccesibilidad("incidentes-mapa-senior-360");

    cy.contains("a", "Resumen").click();
    cy.contains("caption", "Reportes del último mes por zona y tipo").should("exist");
    cy.contains("th", "Todo el barrio").should("exist");
    cy.revisarAccesibilidad("incidentes-resumen-senior-360");
    cy.guardarModo("normal");
  });
});
