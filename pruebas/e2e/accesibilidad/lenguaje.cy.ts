export {};

// Lenguaje llano en pantalla (HU-ACC-08, docs/ACCESIBILIDAD.md §5).

const GENERICOS = /^(aceptar|ok|enviar|continuar|sí|no)$/i;
const EXCLUIDAS = /\b(link|token|login|password|clic|click|moroso|deudor|sincroniz\w*|inválid\w*)\b/i;

describe("@HU-ACC-08 Lenguaje llano en la pantalla", () => {
  ["normal", "senior"].forEach((modo) => {
    it(`@HU-ACC-08 CA1 en modo ${modo}, los botones nombran la acción y ningún texto usa palabras excluidas`, () => {
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/catalogo");
      cy.get("button:visible").each(($boton) => {
        const texto = ($boton.attr("aria-label") ?? $boton.text()).trim();
        expect(texto, "texto del botón").not.to.match(GENERICOS);
        expect(texto.length, "el botón tiene nombre").to.be.greaterThan(2);
      });
      // Cada bloque de texto por separado: párrafos, títulos, etiquetas y opciones.
      cy.get("main :is(p, li, dt, dd, legend, label, h1, h2, h3)").each(($bloque) => {
        const texto = $bloque.text().trim();
        expect(texto).not.to.match(EXCLUIDAS);
        texto
          .split(/(?<=[.!?])\s+/)
          .forEach((oracion) => expect(oracion.split(/\s+/).length, oracion).to.be.lte(20));
      });
    });
  });

  it("@HU-ACC-08 CA2 los avisos de error dicen qué hacer a continuación", () => {
    cy.visit("/catalogo");
    cy.get("[aria-invalid=true], fieldset[aria-describedby]").each(($control) => {
      cy.get(`#${$control.attr("aria-describedby")?.split(" ")[0]}`)
        .invoke("text")
        .should("match", /(Escríbalo|Elija)/);
    });
    cy.contains("[role=alert]", "No pudimos enviar su comprobante").should(
      "contain.text",
      "vuelva a intentarlo",
    );
  });
});
