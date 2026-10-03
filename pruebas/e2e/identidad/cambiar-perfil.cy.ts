export {};

// Pasar del perfil de directiva al de vecino y de vuelta, sin cerrar sesión. Marta es directiva y vecina;
// Ana es solo administradora y Pedro solo directivo mediador: ellos no ven ningún cambio.

const entrar = (dni: string) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
};

describe("@HU-GAR-21 Cambiar entre el perfil de equipo y el de vecino", () => {
  it("@HU-GAR-21 la directiva que también es vecina pasa a su perfil de vecino y vuelve, en teléfono y en modo Senior", () => {
    entrar("40000002");
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/directiva");
    cy.contains("a", "Pasar a mi perfil de vecino").should("exist");
    cy.revisarAccesibilidad("directiva-cambiar-perfil-senior-360");

    cy.visit("/directiva/mas");
    cy.contains("a", "Mi perfil de vecino").should("contain.text", "Ver la plataforma como la ve un vecino");
    cy.revisarAccesibilidad("directiva-mas-cambiar-perfil-senior-360");
    cy.contains("a", "Mi perfil de vecino").click();

    cy.location("pathname").should("eq", "/");
    cy.get("h1").should("contain.text", "Marta");
    cy.contains("a", "Pasar a mi perfil de directiva").should("exist");
    cy.revisarAccesibilidad("vecino-cambiar-perfil-senior-360");
    cy.visit("/mas");
    cy.contains("a", "Mi perfil de directiva").click();
    cy.location("pathname").should("eq", "/directiva");
    cy.guardarModo("normal");
  });

  it("@HU-GAR-21 quien tiene un solo perfil no ve ningún botón de cambio", () => {
    entrar("40000001");
    cy.visit("/administracion/mas");
    cy.get("h1").should("have.text", "Más opciones");
    cy.contains("a", "Mi perfil de").should("not.exist");
    entrar("40000003");
    cy.visit("/directiva/mas");
    cy.get("h1").should("have.text", "Más opciones");
    cy.contains("a", "Mi perfil de").should("not.exist");
    cy.visit("/directiva");
    cy.contains("a", "Pasar a mi perfil").should("not.exist");
  });
});
