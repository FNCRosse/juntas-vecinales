export {};

// La directiva evalúa un reporte (DIR-QUE-01 a DIR-QUE-03) y, si procede, registra lo que se hizo
// (DIR-QUE-04, DIR-QUE-05). El reporte lo envía por la API una vecina nueva.

function reporteNuevo(nombre: string, descripcion: string) {
  return cy.entrarComoVecinaNueva(nombre).then(({ dni }) =>
    cy.task<string>("archivoDePrueba", { dni, uso: "evidencia_queja" }).then((archivoId) =>
      cy
        .request("POST", "/api/quejas", {
          categoria: "RUIDOS",
          descripcion,
          manzana: "F",
          referencia: "frente al parque",
          evidencias: [archivoId],
          consentimiento: true,
          idOperacion: crypto.randomUUID(),
        })
        .its("body"),
    ),
  );
}

const entrarComoMarta = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
};

describe("@HU-QUE-05 @HU-QUE-06 Gestión de un reporte por la directiva", () => {
  it("@HU-QUE-05 CA1 CA2 CA3 la directiva ve las evidencias y rechaza con un motivo; quien reportó ve el motivo", () => {
    reporteNuevo("Ana Ríos Vega", "Mi vecino es un mal vecino").then(
      (queja: { id: string; codigo: string }) => {
        entrarComoMarta();
        cy.viewport(360, 800);
        cy.guardarModo("senior");
        cy.visit(`/directiva/incidentes/${queja.id}`);
        cy.contains("a", "Ver foto 1").should("exist");
        cy.contains("dd", "Ana Ríos Vega").should("exist");
        cy.revisarAccesibilidad("evaluar-reporte-senior-360");
        cy.esperarHidratacion("Revisar la decisión").click();
        cy.get("#campo-decision-error").should("contain.text", "Elija qué decide.");
        cy.contains("label", "No procede").click();
        cy.contains('[role="status"]', "Se enviará una advertencia").should("exist");
        cy.get("#campo-motivo").type("No describe un problema del barrio.");
        cy.contains("button", "Revisar la decisión").click();
        cy.get("h1").should("have.text", "¿Desea marcar el reporte como No procede?");
        cy.revisarAccesibilidad("evaluar-confirmar-senior-360");
        cy.contains("button", "Sí, marcar como No procede").click();
        cy.contains("h2", "Decisión de la directiva").should("exist");
        cy.contains("No procede: No describe un problema del barrio.").should("exist");
        cy.guardarModo("normal");
        cy.clearCookies();
        cy.visit("/seguimiento");
        cy.esperarHidratacion("Buscar mi reporte");
        cy.get("#campo-codigo").type(queja.codigo);
        cy.contains("button", "Buscar mi reporte").click();
        cy.contains('[role="status"]', "La directiva no pudo darle curso").should(
          "contain.text",
          "No describe un problema del barrio.",
        );
      },
    );
  });
});
