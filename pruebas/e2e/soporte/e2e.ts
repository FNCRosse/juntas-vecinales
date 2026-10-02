import type axe from "axe-core";
import "cypress-axe";

// WCAG 2.2 AA (docs/PRUEBAS.md §3).
const ETIQUETAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Audita la pantalla con axe, guarda el reporte y falla si hay alguna violación. */
      revisarAccesibilidad(nombre: string): Chainable<void>;
      /** Guarda "Letra grande" en el perfil del servidor, como lo hace el switch. */
      guardarModo(modo: "normal" | "senior"): Chainable<void>;
    }
  }
}

Cypress.Commands.add("revisarAccesibilidad", (nombre: string) => {
  cy.injectAxe();
  cy.window({ log: false })
    .then((ventana) =>
      (ventana as unknown as { axe: typeof axe }).axe.run(ventana.document, {
        runOnly: { type: "tag", values: ETIQUETAS },
      }),
    )
    .then((resultado) =>
      cy.task("guardarAxe", {
        nombre,
        resultado: {
          url: resultado.url,
          fecha: resultado.timestamp,
          viewport: `${Cypress.config("viewportWidth")}x${Cypress.config("viewportHeight")}`,
          violaciones: resultado.violations,
          reglasSuperadas: resultado.passes.length,
        },
      }),
    );
  cy.checkA11y(undefined, { runOnly: { type: "tag", values: ETIQUETAS } });
});

Cypress.Commands.add("guardarModo", (modo: "normal" | "senior") => {
  cy.request("PUT", "/api/accesibilidad/perfil", { modoSeniorActivo: modo === "senior" })
    .its("status")
    .should("eq", 200);
});
