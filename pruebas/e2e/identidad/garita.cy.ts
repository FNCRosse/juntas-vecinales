export {};

// La tablet de la garita (VIG-INI-01, VIG-CON-01 a 04, VIG-VIS-01 a 05, VIG-BIT-01) y la respuesta de
// la vecina (VEC-GAR-05). En las semillas, Luis es el vigilante; Julio (JLM-314) tiene la casa en rojo;
// Rosa (CDF-220) está al día; Marta vive en Mz. A, lote 12.

const marca = String(Date.now()).slice(-4);
const ANUNCIADA = `Rosa Huamán ${marca}`;
const NO_ANUNCIADA = `José Quispe ${marca}`;

function entrarComo(dni: string) {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" });
  if (dni === "40000002") cy.request("POST", "/api/auth/politica", { acepto: true });
}

describe("@HU-GAR-06 Consultar placas o DNI con el semáforo", () => {
  beforeEach(() => entrarComo("40000004"));

  it("@HU-GAR-06 CA1 CA2 CA3 verde abre la reja, rojo no; la emergencia pide dos pasos y queda en la bitácora", () => {
    cy.visit("/garita");
    cy.get("h1").should("have.text", "Garita principal");
    cy.revisarAccesibilidad("garita-inicio-normal");
    cy.contains("a", "Consultar vecino o placa").click();

    cy.get("#campo-texto").should("be.visible");
    cy.esperarHidratacion("Buscar");
    cy.get("#campo-texto").type("cdf220");
    cy.contains("button", "Buscar").click();
    cy.contains("article", "Vecino del barrio: puede abrirle la reja").should("contain.text", "Rosa Díaz");
    cy.revisarAccesibilidad("consultar-verde-normal");
    cy.contains("button", "Abrir la reja y anotar la entrada").click();
    cy.contains('[role="status"]', "Reja abierta").should("contain.text", "Anotamos la entrada de Rosa Díaz");

    cy.get("#campo-texto").type("JLM-314");
    cy.contains("button", "Buscar").click();
    cy.contains("article", "Vecino atrasado: la reja no se abre sola")
      .should("contain.text", "Julio Mendoza")
      .and("not.contain.text", "S/");
    cy.revisarAccesibilidad("consultar-rojo-normal");
    cy.contains("button", "Abrir por emergencia").click();
    cy.get("h1").should("have.text", "¿Abrir la reja por una emergencia?");
    cy.contains("Paso 2 de 2").should("exist");
    cy.contains("button", "Sí, abrir la reja ahora").click();
    cy.contains("Elija qué pasa para abrir la reja.").should("exist");
    cy.revisarAccesibilidad("emergencia-normal");
    cy.contains("label", "Una emergencia de salud").click();
    cy.contains("button", "Sí, abrir la reja ahora").click();

    cy.location("pathname").should("eq", "/garita/bitacora");
    cy.contains('[role="status"]', "Reja abierta por emergencia").should("exist");
    cy.contains("li", "Julio Mendoza").should(
      "contain.text",
      "Reja abierta por emergencia · Una emergencia de salud",
    );
    cy.revisarAccesibilidad("bitacora-normal");
  });

  it("@HU-GAR-06 AC-4 sin internet responde con la lista guardada y lo dice", () => {
    cy.intercept("GET", "/api/garita/instantanea").as("instantanea");
    cy.visit("/garita/consultar");
    cy.wait("@instantanea");
    cy.intercept("GET", "/api/garita/consulta*", { forceNetworkError: true });
    cy.esperarHidratacion("Buscar");
    cy.get("#campo-texto").type("40000008");
    cy.contains("button", "Buscar").click();
    cy.contains("article", "Elena Soto")
      .should("contain.text", "Sin internet: dato de las")
      .and("contain.text", "Sin internet no se puede anotar ahora");
    cy.revisarAccesibilidad("consultar-sin-internet-normal");
  });

  it("@HU-GAR-06 en modo Senior la consulta cumple WCAG 2.2 AA", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/garita/consultar");
    cy.esperarHidratacion("Buscar");
    cy.get("#campo-texto").type("JLM-314");
    cy.contains("button", "Buscar").click();
    cy.contains("article", "Julio Mendoza").should("exist");
    cy.revisarAccesibilidad("consultar-rojo-senior-360");
    cy.guardarModo("normal");
  });
});

describe("@HU-GAR-07 @HU-GAR-08 Visitas en la garita y bitácora", () => {
  it("@HU-GAR-07 CA1 @HU-GAR-08 CA1 la visita anunciada pasa sin pedirle datos y queda en la bitácora", () => {
    entrarComo("40000002");
    const [fecha, hora] = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date())
      .split(", ");
    cy.request("POST", "/api/garita/visitas", {
      nombre: ANUNCIADA,
      fecha,
      hora,
      conVehiculo: true,
      placa: "ABC123",
    });

    entrarComo("40000004");
    cy.visit("/garita/visitas");
    cy.esperarHidratacion("Buscar");
    cy.get("#campo-visita").type(ANUNCIADA);
    cy.contains("button", "Buscar").click();
    cy.contains('[role="status"]', "Está en la lista de visitas anunciadas").should("exist");
    cy.revisarAccesibilidad("visita-encontrada-normal");
    cy.contains("section", ANUNCIADA).contains("a", "Llegó").click();

    cy.get("h1").should("have.text", `${ANUNCIADA} puede pasar`);
    cy.contains("dd", "Mz. A, lote 12").should("exist");
    cy.revisarAccesibilidad("visita-anunciada-normal");
    cy.esperarHidratacion("Dejar pasar y anotar la entrada").click();
    cy.contains('[role="status"]', `${ANUNCIADA} pasó`).should("exist");
    cy.contains("li", ANUNCIADA)
      .should("contain.text", "ABC-123 · Mz. A, lote 12")
      .and("contain.text", "Sigue dentro");
  });

  it("@HU-GAR-07 CA2 CA3 @HU-GAR-08 CA2 CA3 la no anunciada espera a la casa, entra y sale una sola vez", () => {
    entrarComo("40000004");
    cy.visit("/garita/visitas");
    cy.esperarHidratacion("Buscar");
    cy.get("#campo-visita").type(NO_ANUNCIADA);
    cy.contains("button", "Buscar").click();
    cy.contains('[role="status"]', "no está en la lista de visitas")
      .contains("a", "Preguntar al vecino")
      .click();

    cy.get("h1").should("have.text", "Preguntar al vecino si la deja pasar");
    cy.get("#campo-nombre").should("have.value", NO_ANUNCIADA);
    cy.esperarHidratacion("Preguntar a la casa").click();
    cy.contains("Elija a qué casa va.").should("exist");
    cy.get("#campo-buscar-casa").type("Marta");
    cy.contains("label", "Marta Rojas · Mz. A, lote 12").click();
    cy.get("#campo-motivo").type("Viene a revisar el cable");
    cy.revisarAccesibilidad("preguntar-al-vecino-normal");
    cy.contains("button", "Preguntar a Marta Rojas").click();

    cy.contains('[role="status"]', "Esperando la respuesta de Marta").should("exist");
    cy.revisarAccesibilidad("esperando-respuesta-normal");
    cy.location("pathname").then((ruta) => {
      const id = ruta.split("/").pop();
      entrarComo("40000002");
      cy.visit(`/visitas/${id}/responder`);
      cy.get("h1").should("have.text", `¿Deja pasar a ${NO_ANUNCIADA}?`);
      cy.contains("section", "Viene a revisar el cable").should(
        "contain.text",
        "Registró: Luis Paredes, vigilante",
      );
      cy.revisarAccesibilidad("responder-visita-normal");
      cy.esperarHidratacion("Sí, dejarla pasar").click();
      cy.contains('[role="status"]', "Avisamos a la garita").should("exist");

      entrarComo("40000004");
      cy.visit(ruta);
    });
    cy.contains('[role="status"]', "Marta dijo que sí puede pasar").should("contain.text", "desde la app");
    cy.revisarAccesibilidad("visita-autorizada-normal");
    cy.esperarHidratacion("Dejar pasar y anotar la entrada").click();
    cy.contains("li", NO_ANUNCIADA).should("contain.text", "Visita no anunciada · autorizó Marta Rojas");

    cy.visit("/garita/bitacora?ver=dentro");
    cy.esperarHidratacion(`Marcar salida de ${NO_ANUNCIADA}`).click();
    cy.contains("li", NO_ANUNCIADA).should("not.exist");
    cy.visit("/garita/bitacora");
    cy.contains("li", NO_ANUNCIADA)
      .should("contain.text", "Salió a las")
      .and("contain.text", "Registro protegido: no se edita ni se borra");
  });
});
