export {};

// Comunicados generales (DIR-ASA-14, DIR-ASA-15) y noticias de la junta (VEC-TRA-04, VEC-ACC-09).
// Marta es directiva y vecina, así que una sola sesión publica y lee.

const sufijo = String(Date.now()).slice(-6);
const AVISO = `Corte de agua ${sufijo}`;
const URGENTE = `Se cortó la luz ${sufijo}`;

const entrarComoMarta = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
    .its("status")
    .should("eq", 200);
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-ASA-15 Comunicados generales y feed comunitario", () => {
  beforeEach(entrarComoMarta);

  it("@HU-ASA-15 CA1 CA2 CA3 la directiva redacta, revisa y publica un comunicado urgente en teléfono", () => {
    cy.viewport(360, 800);
    cy.visit("/directiva");
    cy.contains("a", "Publicar un comunicado").click();
    cy.get("h1").should("have.text", "Comunicado a la comunidad");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("comunicado-redactar-360");

    cy.esperarHidratacion("Revisar el comunicado").click();
    cy.get("#campo-titulo-error").should("contain.text", "Escriba el título del comunicado.");
    cy.get("#campo-cuerpo-error").should("contain.text", "Escriba el mensaje del comunicado.");
    cy.revisarAccesibilidad("comunicado-errores-360");

    cy.get("#campo-titulo").type(URGENTE);
    cy.get("#campo-cuerpo").type("Hay un corte de luz en todo el barrio. Vuelve en dos horas.");
    cy.contains("label", "Urgente").click();
    cy.contains("button", "Revisar el comunicado").click();

    cy.get("h1").should("have.text", "¿Desea publicar el comunicado?");
    cy.focused().should("match", "h1");
    cy.contains("dd", URGENTE).should("exist");
    cy.contains("dd", "Urgente").should("exist");
    cy.revisarAccesibilidad("comunicado-confirmar-360");
    cy.contains("button", "Sí, publicar el comunicado").click();

    cy.contains('[role="status"]', "Comunicado publicado").should("exist");
    cy.get("h1").should("have.text", URGENTE);
    cy.revisarAccesibilidad("comunicado-publicado-360");
  });

  it("@HU-ASA-15 CA2 CA3 en modo Senior el vecino ve los urgentes primero, con la palabra Urgente", () => {
    cy.request("POST", "/api/transparencia/comunicados", {
      titulo: AVISO,
      cuerpo: "Sedapal cortará el agua mañana de 9:00 a 13:00.",
      urgencia: "INFORMATIVO",
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/noticias");
    cy.get("h1").should("have.text", "Noticias de la junta");
    cy.get("ul[aria-label='Noticias'] > li").first().should("contain.text", "Urgente");
    cy.contains("li", URGENTE).find("span").contains("Urgente").should("be.visible");
    cy.contains("li", AVISO).should("exist");
    cy.revisarAccesibilidad("noticias-senior-360");

    cy.visit("/");
    cy.contains("h2", "Últimas noticias de la junta").should("exist");
    cy.contains("a", "Ver todas las noticias").should("exist");
    cy.revisarAccesibilidad("inicio-noticias-senior-360");
    cy.contains("a", "Ver todas las noticias").click();
    cy.location("pathname").should("eq", "/noticias");
  });
});
