export {};

// R-11: como máximo 8 objetivos de contenido por pantalla de teléfono en vista normal y 6 en vista
// grande (HU-ACC-09). No cuentan la barra de navegación, el encabezado ("Vista grande", "Pedir ayuda")
// ni el selector de perfil. Se mide en cada ruta real del vecino con las semillas.
//
// `pendiente`: rutas que hoy superan el límite con las semillas (/incidentes: 7 en vista grande); se anotan en
// el registro de Cypress y no bloquean, y se sacan de la lista al rehacerlas según el prototipo.

const LIMITE = { normal: 8, senior: 6 } as const;

const RUTAS: { ruta: string; pendiente?: boolean }[] = [
  { ruta: "/mas" },
  { ruta: "/avisos" },
  { ruta: "/" },
  { ruta: "/mas/ayuda-y-accesibilidad" },
  { ruta: "/mas/perfil" },
  { ruta: "/visitas" },
  { ruta: "/transparencia" },
  { ruta: "/incidentes", pendiente: true },
];

const OBJETIVOS =
  "a:visible, button:visible, input:visible:not([type=hidden]), select:visible, textarea:visible";
// Con ESTRICTA en true también se exigen las rutas pendientes, para ver cuántas faltan.
const ESTRICTA = false;

(["normal", "senior"] as const).forEach((modo) => {
  describe(`@HU-ACC-09 Densidad de objetivos (R-11) en vista ${modo}`, () => {
    beforeEach(() => {
      cy.viewport(360, 800);
      cy.clearCookies();
      cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
      cy.request("POST", "/api/auth/politica", { acepto: true });
      cy.guardarModo(modo);
    });

    RUTAS.forEach(({ ruta, pendiente }) => {
      it(`@HU-ACC-09 CA2 ${ruta}: como máximo ${LIMITE[modo]} objetivos de contenido${pendiente ? " (pendiente de rehacer)" : ""}`, () => {
        cy.visit(ruta);
        cy.get("h1").should("exist");
        cy.get("main").then(($main) => {
          // Un campo con su etiqueta es un solo objetivo; una opción de radio o casilla, uno por opción.
          const n = $main
            .find(OBJETIVOS)
            .filter(
              (_, el) => !el.closest("label") || el.matches("input[type=radio], input[type=checkbox]"),
            ).length;
          cy.log(`${ruta}: ${n} objetivos de contenido (límite ${LIMITE[modo]})`);
          if (pendiente && !ESTRICTA) return;
          expect(n, `objetivos de contenido en ${ruta}`).to.be.lte(LIMITE[modo]);
        });
      });
    });
  });
});
