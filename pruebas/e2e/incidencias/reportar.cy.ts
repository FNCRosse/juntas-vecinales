export {};

// Reportar un problema (VEC-QUE-04 a 07, VEC-QUE-10) y verlo llegar a la directiva (DIR-INI-01, DIR-INI-02,
// DIR-QUE-01). El CI no habla con R2: la subida de la foto se simula y el archivo "subido" se crea en la BD.

const R2_SIMULADO = "https://r2-simulado.invalid/evidencia";

describe("@HU-QUE-01 @HU-QUE-04 Registrar una queja y emitir su ticket", () => {
  it("@HU-QUE-01 CA1 CA2 CA3 @HU-QUE-04 CA1 CA2 CA3 una vecina reporta en teléfono y modo Senior; la directiva lo ve por evaluar", () => {
    cy.entrarComoVecinaNueva("Nora Ruiz Pinto").then(({ dni }) => {
      cy.task<string>("archivoDePrueba", { dni, uso: "evidencia_queja" }).then((archivoId) => {
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
    cy.guardarModo("senior");
    cy.visit("/incidentes");
    cy.get("h1").should("have.text", "Incidentes del barrio");
    cy.contains('[role="status"]', "Todavía no ha hecho reportes").should("exist");
    cy.revisarAccesibilidad("incidentes-vacio-senior-360");

    cy.contains("a", "Reportar un problema").click();
    cy.get("h1").should("have.text", "Reportar un problema");
    cy.esperarHidratacion("Revisar mi reporte").click();
    cy.contains('[role="alert"]', "Faltan corregir 5 datos").should("exist");
    cy.get("#campo-consentimiento").should("contain.text", "Falta marcar esta casilla");
    cy.get("#campo-lugar-error").should("contain.text", "Falta el lugar");
    cy.revisarAccesibilidad("reportar-faltan-datos-senior-360");

    cy.contains("label", "Ruidos molestos").click();
    cy.get("#campo-descripcion").type("Música muy fuerte todas las noches después de las 11 p. m.");
    cy.contains("button", "Elegir la manzana en la lista").click();
    cy.get("h1").should("have.text", "¿Dónde fue?");
    cy.revisarAccesibilidad("reportar-lugar-senior-360");
    cy.contains("label", "Mz. F").click();
    cy.get("#campo-referencia").type("frente al parque");
    cy.contains("button", "Usar este lugar").click();
    cy.contains("Mz. F, frente al parque").should("exist");
    cy.get("#campo-evidencias").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "foto-ruido.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.contains("li", "foto-ruido.jpg").should("exist");
    cy.contains("label", "Acepto la política de privacidad").click();
    cy.contains("button", "Revisar mi reporte").click();

    cy.get("h1").should("have.text", "¿Desea enviar este reporte?");
    cy.contains("dd", "Mz. F, frente al parque").should("exist");
    cy.contains("dd", "Nora Ruiz Pinto").should("exist");
    cy.revisarAccesibilidad("reportar-confirmar-senior-360");
    cy.contains("button", "Sí, enviar mi reporte").click();

    cy.get("h1").should("have.text", "Recibimos su reporte");
    cy.contains('[role="status"]', "Avisamos a la directiva que llegó un reporte nuevo").should("exist");
    cy.contains("Recibido, pendiente de revisión").should("exist");
    cy.contains("strong", /^Q-\d{4}-\d{5}-[A-Z2-9]{4}$/).should("exist");
    cy.revisarAccesibilidad("reporte-enviado-senior-360");
    cy.contains("a", "Volver a Incidentes").click();
    cy.contains("article", "Ruidos molestos").should("contain.text", "Recibido, pendiente de revisión");

    cy.guardarModo("normal");
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.viewport(1280, 900);
    cy.visit("/directiva");
    cy.contains("a", "Incidentes por evaluar").should("exist");
    cy.revisarAccesibilidad("resumen-directiva-para-atender-normal");
    cy.contains("a", "Ver todas las alertas de la directiva").click();
    cy.contains("article", "Llegó un reporte nuevo").should("contain.text", "Mz. F, frente al parque");
    cy.revisarAccesibilidad("alertas-directiva-normal");
    cy.visit("/directiva");
    cy.contains("a", "Incidentes por evaluar").click();
    cy.get("h1").should("have.text", "Incidentes");
    cy.contains("article", "Mz. F, frente al parque").should(
      "contain.text",
      "Recibido, pendiente de revisión",
    );
    cy.get("main").should("not.contain.text", "Nora");
    cy.revisarAccesibilidad("bandeja-incidentes-normal");
  });
});
