export {};

// Catálogo interno de componentes: 0 violaciones axe WCAG 2.2 AA en Normal y Senior,
// en teléfono y escritorio (fase 0b, HU-ACC-05).

const TAMANOS = [
  { nombre: "telefono", ancho: 360, alto: 800 },
  { nombre: "escritorio", ancho: 1280, alto: 800 },
] as const;
const MODOS = ["normal", "senior"] as const;
const PAGINAS = [
  { ruta: "/catalogo", nombre: "catalogo", h1: "Catálogo de componentes" },
  { ruta: "/catalogo/directiva", nombre: "catalogo-directiva", h1: "Marco de la directiva" },
  { ruta: "/catalogo/administrador", nombre: "catalogo-administrador", h1: "Marco del administrador" },
  { ruta: "/catalogo/garita", nombre: "catalogo-garita", h1: "Marco de la garita" },
  { ruta: "/catalogo/acceso", nombre: "catalogo-acceso", h1: "Marco de las pantallas de acceso" },
  { ruta: "/", nombre: "inicio", h1: "Junta Vecinal de Villa de Fátima" },
];

describe("@HU-ACC-05 Catálogo de componentes sin violaciones WCAG 2.2 AA", () => {
  MODOS.forEach((modo) => {
    TAMANOS.forEach(({ nombre, ancho, alto }) => {
      it(`@HU-ACC-05 CA1 CA3 modo ${modo}, ${nombre} (${ancho}×${alto}): 0 violaciones axe`, () => {
        cy.viewport(ancho, alto);
        cy.guardarModo(modo);
        PAGINAS.forEach((pagina) => {
          cy.visit(pagina.ruta);
          cy.get("h1").should("have.length", 1).and("have.text", pagina.h1);
          cy.get("html").should(modo === "senior" ? "have.attr" : "not.have.attr", "data-mode", "senior");
          // Sin scroll horizontal a 360 px (WCAG 1.4.10).
          cy.document().its("documentElement.scrollWidth").should("be.lte", ancho);
          cy.revisarAccesibilidad(`${pagina.nombre}-${modo}-${nombre}`);
        });
      });
    });
  });

  it("@HU-ACC-05 CA2 los estados se dicen con ícono y palabra, no solo con color", () => {
    cy.visit("/catalogo");
    cy.get("[role=status], [role=alert]").each(($mensaje) => {
      cy.wrap($mensaje).find("svg").should("have.length.at.least", 1);
      cy.wrap($mensaje)
        .invoke("text")
        .should("match", /\w{3,}/);
    });
    cy.get("[aria-invalid=true]").each(($campo) => {
      cy.get(`#${$campo.attr("aria-describedby")?.split(" ")[0]}`)
        .should("contain.text", "Escríbalo")
        .find("svg");
    });
  });

  it("@HU-ACC-05 en Senior, la barra del vecino muestra Inicio, Mi cuota, Asambleas y Más", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/catalogo");
    cy.get('nav[aria-label="Principal"] a:visible')
      .then(($a) => [...$a].map((a) => a.textContent))
      .should("deep.equal", ["Inicio", "Mi cuota", "Asambleas", "Más"]);
    cy.guardarModo("normal");
    cy.visit("/catalogo");
    cy.get('nav[aria-label="Principal"] a:visible').should("have.length", 5);
  });
});
