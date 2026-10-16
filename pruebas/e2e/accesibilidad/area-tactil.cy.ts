export {};

// Área táctil de 48 px (56 en Senior) y separación de 8 px (12 en Senior) entre objetivos (HU-ACC-09).

import { ACTORES, entrarComo } from "../soporte/actores";

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

/** Falla si algún objetivo mide menos del mínimo o queda más cerca de otro que la separación. */
function verificar(documento: Document, ruta: string, minimo: number, separacion: number) {
  const lista = cajas(documento);
  expect(lista.length, `${ruta}: objetivos`).to.be.greaterThan(2);
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
}

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
          cy.document().then((documento) => verificar(documento, ruta, minimo, separacion));
        });
      });
    });
  });
});

// Las rutas reales de los cuatro actores, con las semillas, en teléfono y en escritorio.
[
  { modo: "normal", minimo: 48, separacion: 8 },
  { modo: "senior", minimo: 56, separacion: 12 },
].forEach(({ modo, minimo, separacion }) => {
  [360, 1280].forEach((ancho) => {
    ACTORES.forEach((actor) => {
      describe(`@HU-ACC-09 Área táctil real de ${actor.nombre} en modo ${modo} a ${ancho} px`, () => {
        actor.rutas.forEach((ruta) => {
          it(`@HU-ACC-09 CA1 CA2 ${ruta}: objetivos de ${minimo} px o más y a ${separacion} px de los demás`, () => {
            cy.viewport(ancho, 800);
            entrarComo(actor, modo as "normal" | "senior");
            cy.visit(ruta);
            cy.get("h1").should("exist");
            cy.document().then((documento) => verificar(documento, ruta, minimo, separacion));
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

// R-03b: las acciones de resultado opuesto (sí/no, confirmar/cancelar) van apiladas en el teléfono, a 24 px
// una de otra (32 en vista grande). Se mide en pantallas reales donde el resultado de cada botón es opuesto.
[
  { modo: "normal", separacion: 24 },
  { modo: "senior", separacion: 32 },
].forEach(({ modo, separacion }) => {
  describe(`@HU-ACC-09 Acciones opuestas en modo ${modo}`, () => {
    const apiladas = ($arriba: JQuery<HTMLElement>, $abajo: JQuery<HTMLElement>) => {
      const a = $arriba[0].getBoundingClientRect();
      const b = $abajo[0].getBoundingClientRect();
      expect(Math.abs(a.left - b.left), "alineadas en columna").to.be.lessThan(1);
      expect(b.top - a.bottom, `separación vertical (mínimo ${separacion} px)`).to.be.at.least(
        separacion - 0.5,
      );
    };

    it(`@HU-ACC-09 CA3 la vecina: «No, mantener mi cuenta» y «Sí, pedir la cancelación» a ${separacion} px`, () => {
      cy.viewport(360, 800);
      entrarComo(ACTORES[0], modo as "normal" | "senior");
      cy.visit("/mas/perfil/cancelar");
      cy.contains("a", "No, mantener mi cuenta").then(($no) =>
        cy.contains("button", "Sí, pedir la cancelación").then(($si) => apiladas($no, $si)),
      );
    });

    it(`@HU-ACC-09 CA3 la garita: «Sí, abrir la reja ahora» y «No abrir, volver» a ${separacion} px`, () => {
      cy.viewport(360, 800);
      entrarComo(ACTORES[3], modo as "normal" | "senior");
      cy.visit("/garita/consultar");
      cy.esperarHidratacion("Buscar");
      cy.get("#campo-texto").type("JLM-314");
      cy.contains("button", "Buscar").click();
      cy.contains("button", "Abrir por emergencia").click();
      cy.contains("h1", "¿Abrir la reja por una emergencia?");
      cy.contains("button", "Sí, abrir la reja ahora").then(($si) =>
        cy.contains("button", "No abrir, volver").then(($no) => apiladas($si, $no)),
      );
    });
  });
});
