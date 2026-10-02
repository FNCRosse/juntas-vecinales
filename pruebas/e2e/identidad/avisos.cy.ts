export {};

// Avisos y qué avisos recibo (VEC-ACC-11, 12, 16). Una vecina nueva entra con su enlace; sus avisos
// se crean en la BD de pruebas (en el CI el worker no corre).

const sufijo = String(Date.now()).slice(-6);
const DNI = `8${sufijo}4`;
const TELEFONO = `9${sufijo}44`;

const CLAVE = "clave-de-sofia";

/** Una sola vez: la administradora la empadrona; ella entra con su enlace, acepta y crea su clave. */
function prepararVecina() {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
  cy.request("POST", "/api/admin/padron/empadronar", {
    vivienda: {
      manzana: "H",
      lote: `4${sufijo.slice(-3)}`,
      uso: "VIVIENDA",
      familias: 1,
      inquilinos: 0,
      autos: 0,
      motos: 0,
      triciclos: 0,
      negocios: 0,
    },
    titular: { nombreCompleto: "Sofía Castro Ríos", dni: DNI, dniVisto: true, telefono: TELEFONO },
  });
  cy.clearCookies();
  cy.task<string>("enlaceEnCola", { telefono: `51${TELEFONO}` }).then((enlace) => {
    cy.request("POST", "/api/auth/canjear", { token: new URL(enlace).pathname.split("/").pop() });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.request("POST", "/api/auth/clave-respaldo", { clave: CLAVE });
  });
}

describe("@HU-GAR-20 @HU-GAR-18 Avisos de la vecina", () => {
  before(prepararVecina);
  beforeEach(() => {
    cy.request("POST", "/api/auth/clave", { dni: DNI, clave: CLAVE });
  });

  it("@HU-GAR-20 CA1 CA2 CA3 ve sus avisos con su origen, los filtra y los marca como leídos", () => {
    cy.task("avisosDePrueba", {
      dni: DNI,
      avisos: [
        { tipo: "PAGOS", titulo: "Su recibo ya está listo", texto: "Puede verlo en Mi cuota." },
        { tipo: "GARITA", titulo: "Llegó una visita", texto: "Pedro pregunta por usted en la puerta." },
      ],
    });
    cy.visit("/mas");
    cy.contains("a", "Avisos").should("contain.text", "2 avisos nuevos").click();
    cy.get("h1").should("have.text", "Avisos");
    cy.contains("p", "2 sin leer").should("exist");
    cy.get('ul[aria-label="Avisos"] h2').first().should("have.text", "Llegó una visita");
    cy.revisarAccesibilidad("avisos-normal");

    cy.contains("a", "Pagos").click();
    cy.get('ul[aria-label="Avisos"] li')
      .should("have.length", 1)
      .and("contain.text", "Su recibo ya está listo");
    cy.esperarHidratacion("Marcar como leído").click();
    cy.contains("p", "1 sin leer").should("exist");
    cy.contains("a", "Todos").click();
    cy.esperarHidratacion("Marcar todos como leídos").click();
    cy.contains("p", "0 sin leer").should("exist");
    cy.visit("/mas");
    cy.contains("a", "Avisos").should("contain.text", "No tiene avisos nuevos");
  });

  it("@HU-GAR-18 CA1 CA2 CA3 elige qué avisos recibe; los de la reja y la seguridad no se apagan", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/avisos/preferencias");
    cy.get("h1").should("have.text", "Qué avisos recibo");
    cy.esperarHidratacion("Recordatorios de pago");
    cy.contains('[role="switch"]', "Recordatorios de pago")
      .should("have.attr", "aria-checked", "true")
      .click();
    cy.contains('[role="status"]', "El cambio se aplica desde el próximo aviso.").should("exist");
    cy.contains('[role="switch"]', "Recordatorios de pago").should("have.attr", "aria-checked", "false");
    cy.contains("div", "Avisos importantes de su cuenta, la reja y la seguridad").should(
      "contain.text",
      "Siempre",
    );
    cy.revisarAccesibilidad("avisos-preferencias-senior-360");
    cy.reload();
    cy.contains('[role="switch"]', "Recordatorios de pago").should("have.attr", "aria-checked", "false");
  });
});
