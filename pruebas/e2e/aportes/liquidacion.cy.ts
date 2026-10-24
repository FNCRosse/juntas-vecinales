export {};

// Poner al día a un vecino (DIR-COB-15, DIR-COB-16, DIR-COB-17; HU-COB-07). Cada prueba empadrona a una vecina nueva que
// debe nueve semanas y a la que la reja ya no se le abre sola; la directiva (Marta) registra el pago total por las pantallas
// y la garita (Luis) ve la casa en verde.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = [
  "2026-07-27",
  "2026-08-03",
  "2026-08-10",
  "2026-08-17",
  "2026-08-24",
  "2026-08-31",
  "2026-09-07",
  "2026-09-14",
  "2026-09-21",
];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** Crea una vecina con nueve semanas por pagar y la reja suspendida; guarda su sesión y su DNI. */
function vecinaConAtrasoCritico(nombre: string) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.wrap(dni).as("dni");
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "VENCIDA", lineas: [CASA] })),
    });
    cy.task("suspenderReja", { dni });
  });
  cy.getCookie("sesion").then((cookie) => cy.wrap(cookie!.value).as("sesionVecina"));
}

const entrarComoDirectiva = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

const buscar = (nombre: string) => {
  cy.visit("/directiva/cobros/poner-al-dia");
  cy.get("#campo-q").type(nombre);
  cy.contains("button", "Buscar").click();
  cy.contains("article", nombre).should("exist");
};

describe("@HU-COB-07 Poner al día a un vecino", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-07 CA1 CA2 CA3 la directiva registra el pago total, la casa queda al día, la reja se restituye y la garita lo ve", () => {
    const nombre = `Vecina Con Atraso ${sufijo}`;
    vecinaConAtrasoCritico(nombre);
    entrarComoDirectiva();
    cy.viewport(360, 800);

    // DIR-COB-15: la ficha.
    cy.visit("/directiva/mas");
    cy.contains("a", "Poner al día a un vecino").click();
    cy.get("h1").should("have.text", "Poner al día a un vecino");
    cy.revisarAccesibilidad("poner-al-dia-buscar-360");
    buscar(nombre);
    cy.contains("article", nombre)
      .should("contain.text", "DNI terminado en")
      .and("contain.text", "Debe S/ 22.50")
      .and("contain.text", "9 semanas, del 27 de julio al 27 de setiembre")
      .and("contain.text", "9 semanas pendientes")
      .and("contain.text", "La reja no se abre sola para esta casa")
      .and("contain.text", "Cuota semanal S/ 2.50 (casa S/ 2.50)");
    cy.revisarAccesibilidad("poner-al-dia-ficha-360");

    // DIR-COB-16: paso 1.
    cy.contains("article", nombre)
      .contains("a", "Registrar el pago total")
      .invoke("attr", "href")
      .then((href) => cy.visit(href as string));
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.get("h1").should("have.text", `Registrar el pago total de ${nombre}`);
    cy.contains("p", "S/ 22.50").should("exist");
    cy.contains("Para devolverle la apertura automática").should("exist");
    cy.revisarAccesibilidad("poner-al-dia-paso1-360");
    cy.esperarHidratacion("Revisar el pago");
    cy.contains("button", "En efectivo").click();
    cy.contains("button", "Yape o Plin").click();
    cy.get("#campo-numeroOperacion").type("004512");
    cy.contains("button", "Revisar el pago").click();

    // DIR-COB-17: paso 2.
    cy.get("h1").should("have.text", `¿Desea poner al día a ${nombre}?`);
    cy.contains("dd", "S/ 22.50").should("exist");
    cy.contains("dd", "9, del 27 de julio al 27 de setiembre").should("exist");
    cy.contains("dd", "Yape o Plin · operación 004512").should("exist");
    cy.contains("la reja volverá a abrirse sola para su casa").should("exist");
    cy.revisarAccesibilidad("poner-al-dia-confirmar-360");
    cy.contains("button", "Sí, registrar y poner al día").click();

    cy.contains('[role="status"]', `${nombre} está al día`)
      .should("contain.text", "La reja vuelve a abrirse sola")
      .and("contain.text", "Luis Paredes, de la garita");
    cy.revisarAccesibilidad("poner-al-dia-hecho-360");
    cy.contains("a", /Ver el recibo N\.° \d{6}/).click();
    cy.contains("dd", "Yape o Plin (operación 004512)").should("exist");
    cy.contains("dd", "(deuda acumulada)").should("exist");

    // La casa ya no debe nada y busca de nuevo: «No debe nada».
    buscar(nombre);
    cy.contains("article", nombre).should("contain.text", "No debe nada").and("contain.text", "Al día");
    cy.contains("article", nombre).contains("a", "Registrar el pago total").should("not.exist");

    // CA3: la garita ve la casa en verde.
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000004", clave: "clave-de-prueba" });
    cy.request(`/api/garita/consulta?texto=${encodeURIComponent(nombre)}`)
      .its("body.resultados.0.estado")
      .should("eq", "VERDE");

    // La vecina lo ve en su cuenta.
    cy.get<string>("@sesionVecina").then((valor) => {
      cy.clearCookies();
      cy.setCookie("sesion", valor);
    });
    cy.visit("/cuota");
    cy.contains("Está al día. Gracias.").should("exist");
    cy.visit("/cuota/pagos");
    cy.contains("article", /Recibo N\.° \d{6}/)
      .should("contain.text", "Aprobado")
      .and("contain.text", "S/ 22.50");
  });

  it("@HU-COB-07 el mediador ve la ficha sin poder registrar, y en modo Senior el pago tiene pocos objetivos por pantalla", () => {
    const nombre = `Vecina Senior ${sufijo}`;
    vecinaConAtrasoCritico(nombre);
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.viewport(360, 800);
    buscar(nombre);
    cy.contains("article", nombre).contains("a", "Registrar el pago total").should("not.exist");
    cy.request({
      method: "POST",
      url: "/api/aportes/liquidaciones",
      body: { predioId: crypto.randomUUID(), medio: "EFECTIVO", idOperacion: crypto.randomUUID() },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);

    entrarComoDirectiva();
    cy.guardarModo("senior");
    buscar(nombre);
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en la ficha").to.be.lte(6),
    );
    cy.contains("article", nombre)
      .contains("a", "Registrar el pago total")
      .invoke("attr", "href")
      .then((href) => cy.visit(href as string));
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en el paso 1").to.be.lte(6),
    );
    cy.revisarAccesibilidad("poner-al-dia-paso1-senior-360");
  });
});
