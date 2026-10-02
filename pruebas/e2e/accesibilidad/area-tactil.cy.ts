export {};

// Área táctil de 48 px (56 en Senior) y separación de 8 px (12 en Senior) entre objetivos (HU-ACC-09).

type Caja = { x: number; y: number; ancho: number; alto: number; texto: string; el: Element };

const OBJETIVOS =
  "a:not(.sr-only), button, input:not([type=radio]):not([type=checkbox]), label:has(input[type=radio]), label:has(input[type=checkbox])";

function cajas(documento: Document): Caja[] {
  return Array.from(documento.querySelectorAll(OBJETIVOS))
    .filter((el) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed")
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left,
        y: r.top + documento.defaultView!.scrollY,
        ancho: r.width,
        alto: r.height,
        texto: el.textContent?.trim() ?? el.id,
        el,
      };
    })
    .filter((c) => c.ancho > 0 && c.alto > 0);
}

const distancia = (a: Caja, b: Caja) => {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.ancho, b.x + b.ancho));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.alto, b.y + b.alto));
  return Math.hypot(dx, dy);
};

[
  { modo: "normal", minimo: 48, separacion: 8 },
  { modo: "senior", minimo: 56, separacion: 12 },
].forEach(({ modo, minimo, separacion }) => {
  [360, 1280].forEach((ancho) => {
    describe(`@HU-ACC-09 Área táctil en modo ${modo} a ${ancho} px`, () => {
      it(`@HU-ACC-09 CA1 CA2 todo objetivo mide ${minimo} × ${minimo} px o más y queda a ${separacion} px de los demás`, () => {
        cy.viewport(ancho, 800);
        cy.guardarModo(modo as "normal" | "senior");
        ["/catalogo", "/catalogo/directiva", "/catalogo/garita"].forEach((ruta) => {
          cy.visit(ruta);
          cy.document().then((documento) => {
            const lista = cajas(documento);
            expect(lista.length).to.be.greaterThan(5);
            const pequenos = lista
              .filter((c) => c.ancho < minimo - 0.5 || c.alto < minimo - 0.5)
              .map((c) => `${c.texto} (${c.ancho}×${c.alto})`);
            expect(pequenos, `${ruta}: objetivos pequeños`).to.deep.equal([]);
            const juntos: string[] = [];
            lista.forEach((a, i) =>
              lista.slice(i + 1).forEach((b) => {
                if (a.el.contains(b.el) || b.el.contains(a.el)) return;
                // La barra fija del teléfono se mide aparte: su posición en pantalla no es la del documento.
                const fija = (c: Caja) =>
                  c.el.closest("nav") && getComputedStyle(c.el.closest("nav")!).position === "fixed";
                if (fija(a) !== fija(b)) return;
                const d = distancia(a, b);
                if (d < separacion - 0.5) juntos.push(`${a.texto} ↔ ${b.texto} (${d.toFixed(1)} px)`);
              }),
            );
            expect(juntos, `${ruta}: objetivos sin separación`).to.deep.equal([]);
          });
        });
      });
    });
  });
});

describe("@HU-ACC-09 Acciones destructivas separadas", () => {
  it("@HU-ACC-09 CA3 el botón de peligro queda a 48 px o más de las acciones frecuentes", () => {
    cy.visit("/catalogo");
    cy.contains("button", "Dar de baja mi cuenta").then(($peligro) => {
      cy.contains("p", "El recibo estará listo").then(($anterior) => {
        const separacion =
          $peligro[0].getBoundingClientRect().top - $anterior[0].getBoundingClientRect().bottom;
        expect(separacion).to.be.gte(48);
      });
    });
  });
});
