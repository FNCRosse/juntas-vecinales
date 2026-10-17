export {};

// R-11: como máximo 8 objetivos de contenido por pantalla de teléfono en vista normal y 6 en vista
// grande (HU-ACC-09). No cuentan la barra de navegación, el encabezado ("Vista grande", "Pedir ayuda")
// ni el selector de perfil. Se mide en cada ruta real de los cuatro actores con las semillas (soporte/actores.ts).

import { ACTORES, entrarComo, visitarRuta } from "../soporte/actores";

const LIMITE = { normal: 8, senior: 6 } as const;

const OBJETIVOS =
  "a:visible, button:visible, input:visible:not([type=hidden]), select:visible, textarea:visible";

(["normal", "senior"] as const).forEach((modo) => {
  describe(`@HU-ACC-09 Densidad de objetivos (R-11) en vista ${modo}`, () => {
    beforeEach(() => cy.viewport(360, 800));

    ACTORES.forEach((actor) =>
      actor.rutas.forEach((ruta) => {
        it(`@HU-ACC-09 CA2 ${actor.nombre} ${ruta}: como máximo ${LIMITE[modo]} objetivos de contenido`, () => {
          entrarComo(actor, modo, true);
          visitarRuta(ruta);
          cy.get("main").then(($main) => {
            // Un campo con su etiqueta es un solo objetivo; una opción de radio o casilla, uno por opción.
            const n = $main
              .find(OBJETIVOS)
              .filter(
                (_, el) => !el.closest("label") || el.matches("input[type=radio], input[type=checkbox]"),
              ).length;
            cy.log(`${ruta}: ${n} objetivos de contenido (límite ${LIMITE[modo]})`);
            expect(n, `objetivos de contenido en ${ruta}`).to.be.lte(LIMITE[modo]);
          });
        });
      }),
    );
  });
});
