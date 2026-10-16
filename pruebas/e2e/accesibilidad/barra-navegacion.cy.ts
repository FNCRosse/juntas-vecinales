export {};

// R-11: la barra del teléfono tiene como máximo cuatro destinos y cada etiqueta cabe entera en su
// botón, también en Senior (HU-ACC-09). Se comprueba sobre el marco de cada actor del catálogo.

const MARCOS = ["/catalogo/directiva", "/catalogo/administrador", "/catalogo/garita"];

(["normal", "senior"] as const).forEach((modo) => {
  describe(`@HU-ACC-09 Barra de navegación del teléfono en modo ${modo}`, () => {
    MARCOS.forEach((ruta) => {
      it(`@HU-ACC-09 CA2 ${ruta}: hasta cuatro destinos y etiquetas sin desbordar`, () => {
        cy.viewport(360, 800);
        cy.guardarModo(modo);
        cy.visit(ruta);
        cy.get('nav[aria-label="Principal"] li:visible').should("have.length.lte", 4);
        cy.get('nav[aria-label="Principal"] li:visible span').each(($etiqueta) => {
          const etiqueta = $etiqueta[0];
          expect(etiqueta.scrollWidth, `"${etiqueta.textContent}" cabe en su botón`).to.be.lte(
            etiqueta.clientWidth + 1,
          );
        });
      });
    });
  });
});
