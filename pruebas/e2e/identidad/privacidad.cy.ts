export {};

// Mi perfil y privacidad (VEC-ACC-13 y 14) y la bandeja de la administración (ADM-ARC-01 a 03).
// La aprobación cambia datos de las semillas que usan otras pruebas: aquí se rechaza; la aprobación se
// prueba en la integración.

const DNI_NUEVO = `4${String(Date.now()).slice(-7)}`;

function entrarComo(dni: string) {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" });
  if (dni === "40000002") cy.request("POST", "/api/auth/politica", { acepto: true });
}

describe("@HU-GAR-12 @HU-GAR-13 @HU-GAR-16 @HU-GAR-17 Privacidad de la vecina y bandeja de la administración", () => {
  it("@HU-GAR-12 CA1 CA2 baja la copia de sus datos en PDF y queda registrado", () => {
    entrarComo("40000002");
    cy.visit("/mas");
    cy.contains("a", "Mi perfil y privacidad").click();
    cy.get("h1").should("have.text", "Mi perfil y privacidad");
    cy.contains("dd", "Terminado en 02").should("exist");
    cy.revisarAccesibilidad("perfil-normal");
    cy.esperarHidratacion("Bajar una copia de mis datos (PDF)").click();
    cy.contains('[role="status"]', "Descargamos una copia de sus datos")
      .find("a")
      .invoke("attr", "href")
      .then((href) => {
        cy.request({ url: String(href), encoding: "binary" }).then((r) => {
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect(String(r.body).slice(0, 5)).to.eq("%PDF-");
        });
      });
  });

  it("@HU-GAR-13 CA1 CA2 @HU-GAR-16 CA1 CA2 CA3 pide corregir su DNI; la administración lo rechaza con motivo", () => {
    entrarComo("40000002");
    cy.visit("/mas/perfil/corregir");
    cy.esperarHidratacion("Enviar mi solicitud").click();
    cy.contains("Elija qué dato quiere corregir.").should("exist");
    cy.contains("label", "Mi DNI").click();
    cy.get("#campo-valor").type(DNI_NUEVO);
    cy.get("#campo-detalle").type("Así figura en mi DNI");
    cy.revisarAccesibilidad("corregir-dato-normal");
    cy.contains("button", "Enviar mi solicitud").click();
    cy.contains('[role="status"]', "Solicitud enviada").should("contain.text", "Mis solicitudes");
    cy.contains("li", "Corregir el DNI").should("contain.text", "Pendiente de revisión");

    entrarComo("40000001");
    cy.visit("/administracion");
    cy.contains("a", "Solicitudes de privacidad").click();
    cy.get("h1").should("have.text", "Solicitudes de privacidad");
    cy.revisarAccesibilidad("privacidad-normal");
    cy.contains("a", "Rectificación").click();
    cy.contains("li", "Corregir el DNI")
      .should("contain.text", "Marta Rojas · Mz. A, lote 12")
      .and("contain.text", "Van 0 de 10 días hábiles")
      .contains("a", "Resolver")
      .click();

    cy.get("h1").should("have.text", "Corregir el DNI de Marta Rojas");
    cy.contains("dd", DNI_NUEVO).should("exist");
    cy.revisarAccesibilidad("resolver-solicitud-normal");
    cy.contains("label", "Rechazar").click();
    cy.esperarHidratacion("Revisar la decisión").click();
    cy.get("#campo-motivo-error").should("contain.text", "Escriba el motivo");
    cy.get("#campo-motivo").type("El DNI no coincide con su documento");
    cy.contains("button", "Revisar la decisión").click();
    cy.get("h1").should("have.text", "¿Desea rechazar esta corrección?");
    cy.revisarAccesibilidad("resolver-confirmar-normal");
    cy.contains("button", "Sí, rechazar la corrección").click();
    cy.contains('[role="status"]', "Resolvimos la solicitud").should("exist");

    entrarComo("40000002");
    cy.visit("/mas/perfil");
    cy.contains("li", "Corregir el DNI")
      .should("contain.text", "Rechazada")
      .and("contain.text", "El DNI no coincide con su documento");
  });

  it("@HU-GAR-17 CA1 CA2 CA3 pide cambiar su número; la administración verifica su identidad y lo aprueba", () => {
    // Una vecina nueva y ficticia, para no cambiar el número de las semillas que usan otras pruebas.
    const sufijo = String(Date.now()).slice(-6);
    const telefono = `9${sufijo}03`;
    const nuevo = `9${sufijo}04`;
    entrarComo("40000001");
    cy.request("POST", "/api/admin/padron/empadronar", {
      vivienda: {
        manzana: "F",
        lote: sufijo.slice(-4),
        uso: "VIVIENDA",
        familias: 1,
        inquilinos: 0,
        autos: 0,
        motos: 0,
        triciclos: 0,
        negocios: 0,
      },
      titular: { nombreCompleto: "Lucía Paz Vera", dni: `7${sufijo}1`, dniVisto: true, telefono },
    });
    cy.clearCookies();
    cy.task<string>("enlaceEnCola", { telefono: `51${telefono}` }).then((enlace) =>
      cy.visit(new URL(enlace).pathname),
    );
    cy.location("pathname").should("eq", "/entrar/privacidad");
    cy.request("POST", "/api/auth/politica", { acepto: true });

    cy.visit("/mas/perfil/corregir");
    cy.esperarHidratacion("Enviar mi solicitud");
    cy.contains("label", "Mi número de WhatsApp").click();
    cy.contains('[role="status"]', "Primero confirmaremos que es usted").should(
      "contain.text",
      "en su número anterior y en el nuevo",
    );
    cy.get("#campo-valor").type(nuevo);
    cy.revisarAccesibilidad("cambiar-numero-normal");
    cy.contains("button", "Enviar mi solicitud").click();
    cy.contains("li", "Cambiar su número de WhatsApp").should("contain.text", "Pendiente de verificación");

    entrarComo("40000001");
    cy.visit("/administracion/privacidad?tipo=RECTIFICACION");
    cy.contains("li", "Lucía Paz Vera").contains("a", "Resolver").click();
    cy.get("h1").should("have.text", "Cambiar su número de WhatsApp de Lucía Paz Vera");
    cy.contains("label", "Aprobar la corrección").click();
    cy.esperarHidratacion("Revisar la decisión").click();
    cy.contains("Indique cómo se verificó su identidad").should("exist");
    cy.revisarAccesibilidad("verificar-identidad-normal");
    cy.contains("label", "En persona, con su DNI físico").click();
    cy.contains("button", "Revisar la decisión").click();
    cy.contains("Enviaremos una confirmación al número anterior y al nuevo", { matchCase: false }).should(
      "exist",
    );
    cy.contains("button", "Sí, aprobar la corrección").click();
    cy.contains('[role="status"]', "Resolvimos la solicitud").should("exist");
  });

  it("@HU-GAR-16 en modo Senior la bandeja cumple WCAG 2.2 AA", () => {
    entrarComo("40000001");
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/administracion/privacidad");
    cy.get("h1").should("have.text", "Solicitudes de privacidad");
    cy.revisarAccesibilidad("privacidad-senior-360");
    cy.guardarModo("normal");
  });
});
