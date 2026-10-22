export {};

// Observar un comprobante (DIR-COB-05, DIR-COB-06) y mandar otra foto (VEC-COB-07), HU-COB-10. Cada prueba empadrona a una
// vecina nueva, le emite sus cuotas y manda su pago por la API; la directiva (Marta) lo observa por las pantallas y la
// vecina vuelve con la sesión que se guardó. El CI no habla con R2: la subida de la foto se simula.

const sufijo = String(Date.now()).slice(-6);
const R2_SIMULADO = "https://r2-simulado.invalid/comprobante-pago";
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** Crea una vecina con tres semanas por pagar y su pago de tres semanas; guarda su sesión y su DNI para volver a ella. */
function vecinaConPago(nombre: string) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.wrap(dni).as("dni");
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
    });
    cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) =>
      cy
        .request("POST", "/api/aportes/pagos/digital", {
          semanas: 3,
          medio: "YAPE_O_PLIN",
          archivoId,
          idOperacion: crypto.randomUUID(),
        })
        .its("status")
        .should("eq", 201),
    );
  });
  cy.getCookie("sesion").then((cookie) => cy.wrap(cookie!.value).as("sesionVecina"));
}

const entrarComoDirectiva = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

const volverComoVecina = () =>
  cy.get<string>("@sesionVecina").then((valor) => {
    cy.clearCookies();
    cy.setCookie("sesion", valor);
  });

const abrirObservar = (nombre: string) => {
  cy.visit("/directiva/cobros");
  cy.verTodos();
  cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();
  cy.contains("a", "Marcar como observado").click();
  cy.get("h1").should("have.text", "Marcar el pago como observado");
};

describe("@HU-COB-10 Observar un comprobante y mandar otra foto", () => {
  it("@HU-COB-10 CA1 CA2 CA3 la directiva observa con un motivo, la vecina lo lee, manda otra foto y el pago vuelve a revisión", () => {
    const nombre = `Vecina Observada ${sufijo}`;
    vecinaConPago(nombre);
    entrarComoDirectiva();
    cy.viewport(360, 800);
    abrirObservar(nombre);
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.contains(`El pago de ${nombre} (S/ 7.50) quedará observado hasta que lo corrija.`).should("exist");
    cy.revisarAccesibilidad("observar-paso1-360");

    cy.esperarHidratacion("Revisar la observación").click();
    cy.get("#campo-motivo-error").should("contain.text", "Elija por qué lo observa.");
    cy.revisarAccesibilidad("observar-errores-360");
    cy.contains("button", "Elegir el motivo").click();
    for (const causal of [
      "Monto insuficiente",
      "La imagen se ve borrosa",
      "La fecha no coincide",
      "Otro motivo",
    ]) {
      cy.contains("button", causal).should("exist");
    }
    cy.contains("button", "La imagen se ve borrosa").click();
    cy.contains("button", "Revisar la observación").click();

    cy.get("h1").should("have.text", "¿Desea marcar este pago como observado?");
    cy.focused().should("match", "h1");
    cy.contains("dd", nombre).should("exist");
    cy.contains("dd", "S/ 7.50").should("exist");
    cy.contains("dd", "La imagen se ve borrosa").should("exist");
    cy.contains(`Le avisaremos el motivo a ${nombre}.`).should("exist");
    cy.revisarAccesibilidad("observar-confirmar-360");
    cy.contains("button", "Sí, marcar como observado").click();

    cy.contains('[role="status"]', "Pago observado").should(
      "contain.text",
      `Avisamos a ${nombre} el motivo. Podrá enviar otra foto.`,
    );
    cy.revisarAccesibilidad("observar-hecho-360");
    cy.contains("a", "Volver a Cobros").click();
    cy.location("pathname").should("eq", "/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).should("not.exist");

    // La vecina lee el motivo en Mi cuota y en Mis pagos, y puede seguir pagando.
    volverComoVecina();
    cy.visit("/cuota");
    cy.contains("article", "Semana del 7 al 13 de setiembre").should("contain.text", "Pago observado");
    cy.contains("a", "Pagar mi cuota").should("exist");
    cy.revisarAccesibilidad("cuota-pago-observado-360");
    cy.visit("/cuota/pagos");
    cy.contains("article", "Pago del")
      .should("contain.text", "Observado: la foto se ve borrosa")
      .contains("a", "Enviar otra foto")
      .click();

    cy.get("h1").should("have.text", "Enviar otra foto de su pago");
    cy.contains('[role="status"]', "La directiva no pudo leer la foto").should("exist");
    cy.contains("Su pago de S/ 7.50 del").should("contain.text", "sigue guardado.");
    cy.contains("Solo necesitan una foto más clara, donde se vean el monto y la fecha.").should("exist");
    cy.contains("Si el problema era el monto, puede pagar la diferencia desde").should("exist");
    cy.revisarAccesibilidad("otra-foto-360");

    cy.get<string>("@dni").then((dni) =>
      cy.task<string>("archivoDePrueba", { dni, uso: "comprobante_pago" }).then((archivoId) => {
        cy.intercept("POST", "/api/archivos", {
          statusCode: 201,
          body: {
            id: archivoId,
            url: R2_SIMULADO,
            metodo: "PUT",
            cabeceras: { "content-type": "image/jpeg" },
          },
        });
        cy.intercept("PUT", R2_SIMULADO, { statusCode: 200 }).as("subir");
      }),
    );
    cy.esperarHidratacion("Enviar la foto nueva").click();
    cy.get("#campo-archivoId-error").should("contain.text", "Falta la foto de su comprobante");
    cy.get("#campo-archivoId").selectFile({
      contents: Cypress.Buffer.from("foto"),
      fileName: "nueva.jpg",
      mimeType: "image/jpeg",
    });
    cy.wait("@subir");
    cy.contains("Foto cargada: nueva.jpg").should("exist");
    cy.contains("button", "Enviar la foto nueva").click();
    cy.contains('[role="status"]', "Foto enviada").should("contain.text", "Avisamos a la directiva.");
    cy.revisarAccesibilidad("otra-foto-enviada-360");
    cy.contains("a", "Volver a Mis pagos").click();
    cy.contains("article", "Pago del")
      .should("contain.text", "En revisión")
      .and("not.contain.text", "Observado")
      .contains("a", "Enviar otra foto")
      .should("not.exist");

    // La directiva vuelve a verlo en la bandeja, con la foto nueva.
    entrarComoDirectiva();
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).contains("a", "Revisar el comprobante").should("exist");
  });

  it("@HU-COB-10 CA1 «otro motivo» pide escribir cuál es, en modo Senior y con pocos objetivos por pantalla", () => {
    const nombre = `Vecina Otro Motivo ${sufijo}`;
    vecinaConPago(nombre);
    entrarComoDirectiva();
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    abrirObservar(nombre);
    cy.get("main").then(($main) => expect($main.find(OBJETIVOS).length, "objetivos en Senior").to.be.lte(6));

    cy.contains("button", "Elegir el motivo").click();
    cy.contains("button", "Otro motivo").click();
    cy.contains("label", "Cuál es el motivo").should("exist");
    cy.esperarHidratacion("Revisar la observación").click();
    cy.get("#campo-nota-error").should("contain.text", "Escriba cuál es el motivo.");
    cy.revisarAccesibilidad("observar-otro-motivo-senior-360");
    cy.get("#campo-nota").type("Falta el nombre del titular");
    cy.contains("button", "Revisar la observación").click();
    cy.contains("dd", "Falta el nombre del titular").should("exist");
    cy.revisarAccesibilidad("observar-confirmar-senior-360");
    cy.contains("button", "Sí, marcar como observado").click();
    cy.contains('[role="status"]', "Pago observado").should("exist");

    volverComoVecina();
    cy.visit("/cuota/pagos");
    cy.contains("article", "Pago del").should("contain.text", "Observado: falta el nombre del titular");
  });

  it("@HU-COB-10 el mediador no observa: no ve el botón y la API responde 403", () => {
    const nombre = `Vecina Mediador ${sufijo}`;
    vecinaConPago(nombre);
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();
    cy.contains("Solo la directiva aprueba los pagos.").should("exist");
    cy.contains("a", "Marcar como observado").should("not.exist");
    cy.location("pathname").then((ruta) => {
      cy.visit(`${ruta}/observar`);
      cy.location("pathname").should("eq", ruta);
    });
    cy.request({
      method: "PATCH",
      url: `/api/aportes/comprobantes/${crypto.randomUUID()}/observar`,
      body: { motivo: "IMAGEN_BORROSA" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });
});
