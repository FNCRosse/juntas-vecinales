export {};

// Responder un reclamo de cuota (DIR-COB-12, DIR-COB-13, DIR-COB-14; HU-COB-04). Cada prueba empadrona a una vecina nueva que
// paga casa + inquilino, la hace reclamar por la API y deja que la directiva (Marta) responda por las pantallas.

const sufijo = String(Date.now()).slice(-6);
const LINEAS = [
  { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 },
  { clave: "inquilino", nombre: "Inquilino", unidad: "POR_INQUILINO", monto: 250, cantidad: 1 },
];
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** Crea una vecina que debe tres semanas de S/ 5.00, reclama «ya no tengo inquilino» y deja guardada su sesión. */
function vecinaQueReclama(nombre: string) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: LINEAS })),
    });
  });
  cy.request("POST", "/api/aportes/ajustes", {
    motivo: "SIN_INQUILINO",
    idOperacion: crypto.randomUUID(),
  }).then((r) => cy.wrap(r.body.id as string).as("reclamoId"));
  cy.getCookie("sesion").then((cookie) => cy.wrap(cookie!.value).as("sesionVecina"));
}

const entrarComo = (dni: string, politica: boolean) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
  if (politica) cy.request("POST", "/api/auth/politica", { acepto: true });
};

const comoLaVecina = () =>
  cy.get<string>("@sesionVecina").then((valor) => {
    cy.clearCookies();
    cy.setCookie("sesion", valor);
  });

describe("@HU-COB-04 Responder un reclamo de cuota", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-04 CA1 CA2 la directiva aprueba el ajuste, la cuota baja y la vecina lo ve", () => {
    const nombre = `Vecina Reclamo Aprobado ${sufijo}`;
    vecinaQueReclama(nombre);
    entrarComo("40000002", true);
    cy.viewport(360, 800);

    // DIR-COB-12: la lista.
    cy.visit("/directiva/cobros");
    cy.contains("h2", "Reclamos de cuota por atender").should("exist");
    cy.contains("article", nombre)
      .should("contain.text", "Reclamo de cuota · N.° R-")
      .and("contain.text", "Ya no tengo inquilino")
      .and("contain.text", "Por revisar");
    cy.revisarAccesibilidad("reclamos-lista-360");
    cy.contains("article", nombre).contains("a", "Revisar el reclamo").click();

    // DIR-COB-13: el detalle.
    cy.get("h1").should("have.text", `Reclamo de ${nombre}`);
    cy.contains("dd", "S/ 5.00 por semana").should("exist");
    cy.contains("dd", "Casa S/ 2.50 + inquilino S/ 2.50").should("exist");
    cy.contains("dd", "Ninguno").should("exist");
    cy.contains("dd", "3 semanas pendientes").should("exist");
    cy.revisarAccesibilidad("reclamo-detalle-360");
    cy.esperarHidratacion("Revisar la decisión").click();
    cy.get("#campo-decision-error").should("contain.text", "Elija qué decide.");
    cy.contains("button", "Elegir qué decide").click();
    cy.contains("button", "Mantener la cuota de S/ 5.00").should(
      "contain.text",
      "Tendrá que explicar el motivo",
    );
    cy.contains("button", "Aprobar el ajuste")
      .should("contain.text", "Se quita el concepto inquilino: la cuota baja de S/ 5.00 a S/ 2.50 por semana")
      .click();
    cy.contains("button", "Revisar la decisión").click();

    // DIR-COB-14: la confirmación.
    cy.get("h1").should("have.text", "¿Desea enviar esta decisión?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "Aprobar el ajuste").should("exist");
    cy.contains("La cuota se recalcula ahora: baja de S/ 5.00 a S/ 2.50 por semana.").should("exist");
    cy.revisarAccesibilidad("reclamo-confirmar-360");
    cy.contains("button", "Sí, enviar la decisión").click();
    cy.contains('[role="status"]', "Decisión enviada").should(
      "contain.text",
      `La cuota de ${nombre} ahora es S/ 2.50 por semana. Ya le avisamos.`,
    );
    cy.revisarAccesibilidad("reclamo-enviado-360");
    cy.contains("a", "Volver a Cobros").click();
    cy.contains("article", nombre).should("not.exist");

    // La vecina ve la respuesta y su cuota nueva.
    comoLaVecina();
    cy.visit("/cuota");
    cy.contains("S/ 7.50").should("exist");
    cy.get<string>("@reclamoId").then((id) => cy.visit(`/cuota/reclamo/${id}`));
    cy.get("h1").should("have.text", "Su reclamo fue aprobado");
    cy.contains("La cuota baja de S/ 5.00 a S/ 2.50 por semana.").should("exist");
    cy.revisarAccesibilidad("reclamo-respuesta-360");
  });

  it("@HU-COB-04 CA3 la directiva mantiene la cuota: tiene que explicar el motivo y la vecina lo lee", () => {
    const nombre = `Vecina Reclamo Mantenido ${sufijo}`;
    vecinaQueReclama(nombre);
    entrarComo("40000002", true);
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.contains("article", nombre).contains("a", "Revisar el reclamo").click();
    cy.esperarHidratacion("Revisar la decisión");
    cy.contains("button", "Elegir qué decide").click();
    cy.contains("button", "Mantener la cuota de S/ 5.00").click();
    cy.get("#campo-motivo").should("exist");
    cy.contains("label", `Motivo (se lo enviaremos a ${nombre})`).should("exist");
    cy.contains("button", "Revisar la decisión").click();
    cy.get("#campo-motivo-error").should("contain.text", "Escriba el motivo para explicárselo a la casa.");
    cy.revisarAccesibilidad("reclamo-motivo-errores-360");
    cy.get("#campo-motivo").type("El contrato del inquilino sigue vigente.");
    cy.contains("button", "Revisar la decisión").click();
    cy.get("h1").should("have.text", "¿Desea enviar esta decisión?");
    cy.contains("dd", "El contrato del inquilino sigue vigente.").should("exist");
    cy.contains("button", "Sí, enviar la decisión").click();
    cy.contains('[role="status"]', "Decisión enviada").should("contain.text", "ahora es S/ 5.00 por semana");

    comoLaVecina();
    cy.get<string>("@reclamoId").then((id) => cy.visit(`/cuota/reclamo/${id}`));
    cy.get("h1").should("have.text", "La directiva revisó su reclamo");
    cy.contains("El contrato del inquilino sigue vigente.").should("exist");
    cy.revisarAccesibilidad("reclamo-mantenido-360");
    cy.visit("/cuota");
    cy.contains("S/ 15.00").should("exist");
  });

  it("@HU-COB-04 el mediador ve el reclamo sin poder responderlo, en modo Senior", () => {
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    const nombre = `Vecina Reclamo Mediador ${sufijo}`;
    vecinaQueReclama(nombre);
    entrarComo("40000003", false);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.contains("article", nombre).should("exist").find("a").should("not.exist");
    cy.get<string>("@reclamoId").then((id) => {
      cy.visit(`/directiva/cobros/reclamos/${id}`);
      cy.get("h1").should("have.text", `Reclamo de ${nombre}`);
      cy.contains("Solo la directiva responde los reclamos.").should("exist");
      cy.contains("button", "Revisar la decisión").should("not.exist");
      cy.get("main").then(($main) =>
        expect($main.find(OBJETIVOS).length, "objetivos en el reclamo").to.be.lte(6),
      );
      cy.revisarAccesibilidad("reclamo-mediador-senior-360");
      cy.request({
        method: "PATCH",
        url: `/api/aportes/ajustes/${id}`,
        body: { decision: "MANTENER", motivo: "No" },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });
});
