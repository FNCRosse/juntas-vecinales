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
        cy.get("h2").should("contain.text", "¿Desea marcar el reporte como No procede?");
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

  it("@HU-QUE-05 CA2 @HU-QUE-06 CA1 CA2 CA3 la directiva admite con prioridad, registra la mediación y cierra; quien reportó recibe el detalle", () => {
    reporteNuevo("Marco Díaz León", "Música muy fuerte todas las noches").then(
      (queja: { id: string; codigo: string }) => {
        entrarComoMarta();
        cy.viewport(1280, 900);
        cy.visit(`/directiva/incidentes/${queja.id}`);
        cy.esperarHidratacion("Revisar la decisión");
        cy.contains("label", "Procede").click();
        cy.contains("label", "Alta").click();
        cy.contains("button", "Revisar la decisión").click();
        cy.contains("button", "Sí, pasar a En revisión").click();
        cy.contains("Procede, con prioridad alta.").should("exist");
        cy.contains("h2", "Registrar lo que se hizo").should("exist");
        cy.esperarHidratacion("Revisar y cerrar el caso").click();
        cy.get("#campo-detalle-error").should("contain.text", "Escriba qué se hizo");
        cy.contains("label", "Mediación en persona, con acuerdo").click();
        cy.get("#campo-detalle").type(
          "Conversamos con el vecino y acordó bajar la música desde las 10 p. m.",
        );
        cy.revisarAccesibilidad("registrar-solucion-normal");
        cy.contains("button", "Revisar y cerrar el caso").click();
        cy.get("h2").should("contain.text", "¿Desea cerrar el caso como resuelto?");
        cy.revisarAccesibilidad("cerrar-resuelto-normal");
        cy.contains("button", "Sí, cerrar como resuelto").click();
        cy.contains("Resuelto").should("exist");
        cy.contains("strong", "Mediación en persona, con acuerdo").should("exist");
        cy.clearCookies();
        cy.visit("/seguimiento");
        cy.esperarHidratacion("Buscar mi reporte");
        cy.get("#campo-codigo").type(queja.codigo);
        cy.contains("button", "Buscar mi reporte").click();
        cy.contains('[role="status"]', "Su reporte se resolvió").should(
          "contain.text",
          "acordó bajar la música",
        );
        cy.contains("li", "3. Resuelto").should("contain.text", "Hecho");
        cy.revisarAccesibilidad("avance-resuelto-normal");
      },
    );
  });

  it("@HU-QUE-07 CA1 CA2 CA3 la directiva deriva a la PNP con el expediente; quien reportó ve el oficio", () => {
    reporteNuevo("Rita Soto Paz", "Una persona forzaba las rejas de noche").then(
      (queja: { id: string; codigo: string }) => {
        entrarComoMarta();
        cy.viewport(360, 800);
        cy.visit(`/directiva/incidentes/${queja.id}`);
        cy.esperarHidratacion("Revisar la decisión");
        cy.contains("label", "Excede a la junta").click();
        cy.contains("En el siguiente paso armará el expediente").should("exist");
        cy.contains("button", "Revisar la decisión").click();
        cy.get("h1").should("have.text", "Derivar a una entidad externa");
        cy.contains("h2", "Expediente digital").should("exist");
        cy.esperarHidratacion("Revisar la derivación").click();
        cy.get("#campo-entidad-error").should("contain.text", "Elija a qué entidad lo envía.");
        cy.contains("label", "Policía Nacional del Perú").click();
        cy.contains("a", "Ver el oficio en PDF")
          .should("have.attr", "href")
          .then((href) =>
            cy.request(String(href)).its("headers.content-type").should("eq", "application/pdf"),
          );
        cy.revisarAccesibilidad("derivar-360");
        cy.contains("button", "Revisar la derivación").click();
        cy.get("h1").should("have.text", "¿Desea derivar el reporte a Policía Nacional del Perú (PNP)?");
        cy.revisarAccesibilidad("derivar-confirmar-360");
        cy.contains("button", "Sí, derivar el reporte").click();
        cy.contains("Derivado a Policía Nacional del Perú (PNP) con el oficio N.°").should("exist");
        cy.clearCookies();
        cy.visit("/seguimiento");
        cy.esperarHidratacion("Buscar mi reporte");
        cy.get("#campo-codigo").type(queja.codigo);
        cy.contains("button", "Buscar mi reporte").click();
        cy.contains('[role="status"]', "Su reporte pasó a otra entidad").should("exist");
        cy.contains("a", "Descargar el oficio")
          .should("have.attr", "href")
          .then((href) =>
            cy.request(String(href)).its("headers.content-type").should("eq", "application/pdf"),
          );
        cy.revisarAccesibilidad("avance-derivado-360");
      },
    );
  });
});
