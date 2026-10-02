export {};

// Entrada del equipo con DNI y clave (ADM-ENT-01, VIG-ENT-01) y cierre de sesión.
// Las cuentas salen de las semillas ficticias (npm run semillas).

const CLAVE = "clave-de-prueba";
const entrarComo = (dni: string) =>
  cy.request("POST", "/api/auth/clave", { dni, clave: CLAVE }).its("status").should("eq", 200);

describe("@HU-GAR-21 Entrada del equipo", () => {
  beforeEach(() => cy.clearCookies());

  it("@HU-GAR-21 CA2 sin sesión, las páginas del equipo llevan a la entrada", () => {
    ["/administracion", "/garita", "/directiva"].forEach((ruta) => {
      cy.visit(ruta);
      cy.location("pathname").should("eq", "/entrar/equipo");
    });
  });

  [
    { modo: "normal", ancho: 360 },
    { modo: "senior", ancho: 360 },
    { modo: "normal", ancho: 1280 },
  ].forEach(({ modo, ancho }) => {
    it(`@HU-GAR-21 CA2 la entrada cumple WCAG 2.2 AA en modo ${modo} a ${ancho} px, también con errores`, () => {
      cy.viewport(ancho, 800);
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/entrar/equipo");
      cy.get("h1").should("have.text", "Entrar como parte del equipo");
      cy.revisarAccesibilidad(`entrada-equipo-${modo}-${ancho}`);
      cy.esperarHidratacion("Entrar con mi clave").click();
      cy.get("#campo-dni-error").should("contain.text", "Su DNI tiene 8 números");
      cy.get("#campo-clave-error").should("contain.text", "Falta la clave");
      cy.revisarAccesibilidad(`entrada-equipo-errores-${modo}-${ancho}`);
    });
  });

  it("@HU-GAR-24 CA2 una clave que no coincide se avisa junto al campo, sin borrar el DNI", () => {
    cy.visit("/entrar/equipo");
    cy.esperarHidratacion("Entrar con mi clave");
    cy.get("#campo-dni").type("40000001");
    cy.get("#campo-clave").type("otra-clave");
    cy.contains("button", "Entrar con mi clave").click();
    cy.get("#campo-clave-error").should(
      "have.text",
      "El DNI o la clave no coinciden. Revíselos y vuelva a intentarlo.",
    );
    cy.get("#campo-dni").should("have.value", "40000001");
  });

  it("@HU-GAR-21 CA2 la administradora entra con su clave, ve su panel y cierra sesión", () => {
    cy.visit("/entrar/equipo");
    cy.esperarHidratacion("Entrar con mi clave");
    cy.get("#campo-dni").type("40000001");
    cy.get("#campo-clave").type(CLAVE);
    cy.contains("button", "Mostrar").click().should("have.attr", "aria-pressed", "true");
    cy.get("#campo-clave").should("have.attr", "type", "text");
    cy.contains("button", "Entrar con mi clave").click();

    cy.location("pathname").should("eq", "/administracion");
    cy.get("h1").should("match", /^(Buenos días|Buenas tardes|Buenas noches), Ana$/);
    cy.revisarAccesibilidad("panel-administracion-normal");

    cy.visit("/administracion/mas");
    cy.esperarHidratacion("Cerrar sesión").click();
    cy.location("pathname").should("eq", "/entrar/equipo");
    cy.visit("/administracion");
    cy.location("pathname").should("eq", "/entrar/equipo");
  });

  it("@HU-GAR-21 CA2 cada rol va a su inicio y no entra al de otro", () => {
    entrarComo("40000004");
    cy.visit("/entrar/equipo");
    cy.location("pathname").should("eq", "/garita");
    cy.get("h1").should("have.text", "Garita principal");
    cy.revisarAccesibilidad("inicio-garita-normal");
    cy.visit("/administracion");
    cy.location("pathname").should("eq", "/garita");

    cy.clearCookies();
    entrarComo("40000002");
    cy.visit("/directiva");
    cy.get("h1").should("contain.text", "Marta");
    cy.revisarAccesibilidad("resumen-directiva-normal");
  });
});
