export {};

// El inicio con lo de cobros (VEC-ACC-09 y DIR-INI-01; HU-GAR-19). El vecino ve lo que debe sin navegar (AC-2); la directiva ve
// lo que espera en cobros. Cada prueba empadrona a una vecina nueva con tres semanas por pagar.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];

function vecinaConCuotas(nombre: string) {
  return cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
    });
    return cy.wrap(dni);
  });
}

describe("@HU-GAR-19 El inicio con lo de cobros", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-GAR-19 CA1 CA2 CA3 AC-2 el vecino ve lo que debe en la primera pantalla y llega a su cuota con un toque", () => {
    vecinaConCuotas(`Vecina Del Inicio ${sufijo}`).then((dni) => cy.wrap(dni).as("dni"));
    cy.viewport(360, 800);
    cy.visit("/");
    cy.get("h1").should("contain.text", "Hola,");
    cy.contains("section", "Mi cuota semanal: S/ 2.50")
      .should("contain.text", "Debe S/ 7.50")
      .and("contain.text", "3 semanas, del 7 al 27 de setiembre")
      .and("contain.text", "3 semanas pendientes")
      .and("contain.text", "Puede ponerse al día cuando pueda.");
    cy.revisarAccesibilidad("inicio-cuota-360");

    // La reja suspendida se ve sin entrar a Mi cuota.
    cy.get<string>("@dni").then((dni) => cy.task("suspenderReja", { dni }));
    cy.reload();
    cy.contains("[role=status]", "Por ahora el vigilante no le abrirá la reja").should("exist");

    // Al pagar todo, el bloque cambia.
    cy.get<string>("@dni").then((dni) =>
      SEMANAS.forEach((periodo) => cy.task("abonarCuota", { dni, periodo, saldo: 0, estado: "PAGADA" })),
    );
    cy.reload();
    cy.contains("section", "Mi cuota semanal")
      .should("contain.text", "No debe nada")
      .and("contain.text", "Al día")
      .and("not.contain.text", "Debe S/");
    cy.revisarAccesibilidad("inicio-cuota-al-dia-360");
    cy.contains("a", "Ver el detalle de mi cuota").click();
    cy.location("pathname").should("eq", "/cuota");
  });

  it("@HU-GAR-19 DIR-INI-01 la directiva ve cuántos cobros esperan en una sola tarjeta que lleva a Cobros", () => {
    vecinaConCuotas(`Vecina Reclama Inicio ${sufijo}`);
    cy.request("POST", "/api/aportes/ajustes", { motivo: "SIN_INQUILINO", idOperacion: crypto.randomUUID() });
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva");
    // El resumen cuenta lo que espera en una sola tarjeta, "Para atender", que lleva a la lista de lo pendiente.
    cy.contains("section", "Para atender").should("contain.text", "Reclamos de cuota");
    cy.revisarAccesibilidad("resumen-directiva-cobros-senior-360");
    cy.contains("a", "Ver lo que hay que atender").click();
    cy.location("pathname").should("eq", "/directiva/para-atender");
    cy.contains("a", "Reclamos de cuota").click();
    cy.location("pathname").should("eq", "/directiva/cobros");
    cy.get("h1").should("have.text", "Cobros");
  });
});
