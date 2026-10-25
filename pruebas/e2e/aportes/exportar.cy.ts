export {};

// Exportar la recaudación (DIR-COB-19 y DIR-INI-05; HU-COB-15). La directiva (Marta) elige periodo y estado, descarga el CSV y la
// descarga queda en el historial de acciones; el mediador no exporta.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };

const entrarComo = (dni: string, politica: boolean) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
  if (politica) cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-COB-15 Exportar la recaudación", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-15 CA1 CA2 CA3 la directiva elige periodo y estado, descarga el CSV y queda en el historial", () => {
    cy.entrarComoVecinaNueva(`Vecina Que Exporta ${sufijo}`).then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: [{ periodo: "2026-01-05", estado: "VENCIDA", lineas: [CASA] }],
      });
      cy.task("reciboDePrueba", { dni, monto: 12345, medio: "EFECTIVO" });
    });
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/recaudacion");
    cy.contains("a", "Exportar a Excel o CSV").click();

    // DIR-COB-19.
    cy.get("h1").should("have.text", "Exportar la recaudación");
    cy.contains("Para guardar un respaldo o revisarlo en una hoja de cálculo.").should("exist");
    cy.contains("p", "CSV (.csv)").should("exist");
    cy.contains("dt", "Total cobrado").next("dd").should("contain.text", "S/ ");
    cy.contains("dt", "Desglose").next("dd").should("have.text", "Por semana, por casa y por estado");
    cy.contains("La descarga queda en el historial de acciones con su nombre, la fecha y la hora.").should(
      "exist",
    );
    cy.revisarAccesibilidad("exportar-360");
    cy.contains("button", "Todas las casas").click();
    cy.contains("button", "8 semanas o más").click();
    cy.location("search").should("contain", "estado=CRITICO");

    // El archivo: BOM, los mismos totales y el detalle por estado.
    cy.contains("a", "Descargar el archivo")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "utf8" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("text/csv; charset=utf-8");
          expect(r.headers["content-disposition"]).to.contain("attachment; filename=");
          expect(r.body as string).to.contain("Recaudación de la cuota de vigilancia");
          expect(r.body as string).to.contain("Estado de las casas,8 semanas o más");
          expect(r.body as string).to.contain("Total cobrado (S/),");
          expect(r.body as string).to.contain("Por casa");
        }),
      );

    // CA3: queda en el historial de acciones, con quién lo hizo.
    cy.contains("a", "Ver el historial de acciones").click();
    cy.get("h1").should("have.text", "Historial de acciones");
    cy.contains("article", "Exportó la recaudación a un archivo").should("contain.text", "Marta Rojas");
    cy.revisarAccesibilidad("historial-con-exportacion-360");
  });

  it("@HU-COB-15 el mediador ve la recaudación pero no la exporta, en vista grande", () => {
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    entrarComo("40000003", false);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/recaudacion");
    cy.get("h1").should("have.text", "Recaudación");
    cy.contains("a", "Exportar a Excel o CSV").should("not.exist");
    cy.visit("/directiva/cobros/recaudacion/exportar");
    cy.contains("h1", "Exportar la recaudación").should("not.exist");
    cy.request({ url: "/api/transparencia/exportar", failOnStatusCode: false })
      .its("status")
      .should("eq", 403);
  });
});
