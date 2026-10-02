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
      /** Espera a que React haya hidratado el botón: antes, la página es solo HTML y no responde. */
      esperarHidratacion(textoDelBoton: string): Chainable<JQuery<HTMLButtonElement>>;
      /**
       * Empadrona a una vecina ficticia nueva y entra con su enlace: para las pruebas que cambian o
       * borran los datos de la persona, sin tocar las semillas que usan las demás.
       */
      entrarComoVecinaNueva(nombre: string): Chainable<{ telefono: string; dni: string }>;
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

Cypress.Commands.add("esperarHidratacion", (textoDelBoton: string) =>
  cy.contains("button", textoDelBoton).should(($boton) =>
    expect(
      Object.keys($boton[0]).some((k) => k.startsWith("__reactProps")),
      "hidratado",
    ).to.eq(true),
  ),
);

Cypress.Commands.add("entrarComoVecinaNueva", (nombre: string) => {
  const sufijo = String(Date.now()).slice(-6);
  const datos = { telefono: `9${sufijo}03`, dni: `7${sufijo}1` };
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
  cy.request("POST", "/api/admin/padron/empadronar", {
    vivienda: {
      manzana: "F",
      lote: sufijo.slice(-4),
      uso: "VIVIENDA",
      familias: 1,
      inquilinos: 0,
      autos: 0,
      motos: 0,
      triciclos: 0,
      negocios: 0,
    },
    titular: { nombreCompleto: nombre, dni: datos.dni, dniVisto: true, telefono: datos.telefono },
  });
  cy.clearCookies();
  cy.task<string>("enlaceEnCola", { telefono: `51${datos.telefono}` }).then((enlace) =>
    cy.visit(new URL(enlace).pathname),
  );
  cy.location("pathname").should("eq", "/entrar/privacidad");
  cy.request("POST", "/api/auth/politica", { acepto: true });
  return cy.wrap(datos);
});
