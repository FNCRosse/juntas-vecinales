export {};

// Reporte en modo anónimo (VEC-QUE-04, 06, 07) y lo que ve la directiva (DIR-QUE-01).

const R2_SIMULADO = "https://r2-simulado.invalid/evidencia-anonima";

describe("@HU-QUE-02 Modo anónimo", () => {
  it("@HU-QUE-02 CA1 CA2 CA3 la vecina envía sin su nombre, recibe su código y la directiva no sabe quién fue", () => {
    cy.entrarComoVecinaNueva("Inés Salazar Rojas").then(({ dni }) => {
      cy.task<string>("archivoDePrueba", { dni, uso: "evidencia_queja" }).then((archivoId) => {
        cy.intercept("POST", "/api/archivos", {
          statusCode: 201,
          body: {
            id: archivoId,
            url: R2_SIMULADO,
            metodo: "PUT",
            cabeceras: { "content-type": "image/jpeg" },
          },
        });
        cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
      });
    });
    cy.viewport(360, 800);
    cy.visit("/incidentes/reportar");
    cy.esperarHidratacion("Revisar mi reporte");
    cy.contains("label", "Seguridad").click();
    cy.get("#campo-descripcion").type("Robaron el espejo de un auto estacionado");
    cy.contains("button", "Cerca de mi casa").click();
    cy.get("#campo-evidencias").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "espejo.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "false").click();
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "true").and("contain.text", "Sí");
    cy.revisarAccesibilidad("reportar-anonimo-360");
    cy.contains("label", "Acepto la política de privacidad").click();
    cy.contains("button", "Revisar mi reporte").click();
    cy.contains("dd", "Sin su nombre (anónimo)").should("exist");
    cy.contains("button", "Sí, enviar mi reporte").click();
    cy.contains("aunque haya enviado el reporte sin su nombre").should("exist");
    cy.contains("strong", /^Q-\d{4}-\d{5}-[A-Z2-9]{4}$/).should("exist");
    cy.revisarAccesibilidad("reporte-anonimo-enviado-360");

    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.visit("/directiva/incidentes");
    cy.contains("li", "Robaron").should("not.exist");
    cy.contains("li", "Seguridad").should("contain.text", "Reporte anónimo");
    cy.get("main").should("not.contain.text", "Inés");
    cy.revisarAccesibilidad("bandeja-anonimo-360");
  });
});
