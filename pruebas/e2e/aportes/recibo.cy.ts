export {};

// Recibo digital oficial (DIR-COB-04, DIR-COB-11, VEC-COB-06, VEC-COB-14 y VEC-COB-15; HU-COB-12). Cada prueba empadrona a
// una vecina nueva, le emite sus cuotas y manda su pago por la API; la directiva (Marta) lo aprueba por las pantallas y la
// vecina vuelve con la sesión que se guardó.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** Crea una vecina con tres semanas por pagar y su pago de tres semanas; guarda su sesión para volver a ella. */
function vecinaConPago(nombre: string) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
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

/** La directiva aprueba el pago de la vecina por las pantallas y queda en el cierre, con el recibo emitido. */
const aprobarElPago = (nombre: string) => {
  cy.visit("/directiva/cobros");
  cy.verTodos();
  cy.contains("article", nombre).contains("a", "Revisar el comprobante").click();
  cy.esperarHidratacion("Aprobar el pago").click();
  cy.contains("button", "Sí, aprobar el pago").click();
  cy.contains('[role="status"]', "Pago aprobado").should("contain.text", "Emitimos el recibo N.° ");
};

const objetivosEnSenior = (ruta: string) => {
  cy.get("main").then(($main) => expect($main.find(OBJETIVOS).length, `objetivos en ${ruta}`).to.be.lte(6));
};

describe("@HU-COB-12 Recibo digital oficial", () => {
  it("@HU-COB-12 CA1 CA2 CA3 la directiva aprueba, el recibo se emite y se envía a la app; la casa lo confirma y pide su copia en papel", () => {
    const nombre = `Vecina Con Recibo ${sufijo}`;
    vecinaConPago(nombre);
    entrarComoDirectiva();
    cy.viewport(360, 800);
    aprobarElPago(nombre);

    // DIR-COB-04: el recibo con lo que dice el papel, listo para enviarlo, imprimirlo o bajarlo.
    cy.contains(
      '[aria-label^="Recibo oficial N.°"]',
      "Cuota de vigilancia: 3 semanas, del 7 al 27 de setiembre",
    ).within(() => {
      cy.contains("dt", "Vecino o vecina").next("dd").should("have.text", nombre);
      cy.contains("dt", "Total").next("dd").should("have.text", "S/ 7.50");
      cy.contains("dt", "Registrado por").next("dd").should("have.text", "Marta Rojas");
      cy.contains("dt", "Código de verificación")
        .next("dd")
        .invoke("text")
        .should("match", /^JV-\d{6}-[0-9A-F]{4}$/);
    });
    cy.contains("a", "Ver para imprimir y entregar en su casa").should("have.attr", "target", "_blank");
    cy.revisarAccesibilidad("recibo-aprobado-360");
    cy.contains("a", "Descargar el PDF")
      .invoke("attr", "href")
      .then((href) =>
        cy.request({ url: href as string, encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect(r.headers["content-disposition"]).to.match(/^attachment/);
          expect((r.body as string).slice(0, 5)).to.eq("%PDF-");
        }),
      );

    cy.contains("button", `Enviarlo a la app de ${nombre}`).click();
    cy.contains('[role="status"]', "Recibo enviado").should(
      "contain.text",
      "con un botón para confirmar que lo recibió",
    );
    cy.contains("button", "Enviarlo a la app").should("not.exist");
    cy.revisarAccesibilidad("recibo-enviado-360");

    // VEC-COB-05 y 06: la casa lo ve en Mis pagos y recibos, lo lee y confirma que lo recibió.
    volverComoVecina();
    cy.visit("/cuota/pagos");
    cy.contains("a", "Pedir un recibo en papel").should("exist");
    cy.contains("article", /Recibo N\.° \d{6}/)
      .should("contain.text", "Aprobado")
      .and("not.contain.text", "Constancia de envío")
      .contains("a", "Ver el recibo")
      .click();
    cy.get("h1")
      .invoke("text")
      .should("match", /^Recibo N\.° \d{6}$/);
    cy.contains("dt", "Concepto").next("dd").should("contain.text", "Cuota de vigilancia: 3 semanas");
    cy.contains("dt", "Recibió").next("dd").should("have.text", "Marta Rojas");
    cy.contains("Este recibo digital vale igual que el de papel.").should("exist");
    cy.revisarAccesibilidad("recibo-vecina-360");
    cy.contains("a", "Descargar recibo (PDF)")
      .invoke("attr", "href")
      .then((href) =>
        cy
          .request(href as string)
          .its("status")
          .should("eq", 200),
      );
    cy.esperarHidratacion("Confirmar que lo recibí").click();
    cy.contains('[role="status"]', "Gracias, ya lo anotamos").should("exist");
    cy.revisarAccesibilidad("recibo-confirmado-360");

    // VEC-COB-14 y 15: pide la copia en papel.
    cy.contains("a", "Pedir este recibo en papel").click();
    cy.get("h1").should("have.text", "Pedir mi recibo en papel");
    cy.contains("strong", "Quién pide:").parent().should("contain.text", nombre);
    cy.revisarAccesibilidad("recibo-papel-360");
    cy.esperarHidratacion("Pedir mi recibo").click();
    cy.get("#campo-franja-error").should("contain.text", "Elija a qué hora le queda mejor que vayan.");
    cy.contains("button", "Elegir la hora").click();
    cy.contains("button", "En la tarde").click();
    cy.get("#campo-nota").type("Tocar el timbre dos veces");
    cy.contains("button", "Pedir mi recibo").click();
    cy.get("h1").should("have.text", "Le llevarán su recibo");
    cy.contains('[role="status"]', "Pedido enviado a la directiva").should("exist");
    cy.contains("Pedido N.° R-").should("exist");
    cy.contains("dd", "Tarde, de 2:00 p. m. a 6:00 p. m.").should("exist");
    cy.contains("Pendiente de visita").should("exist");
    cy.revisarAccesibilidad("recibo-papel-pedido-360");

    // DIR-COB-11: la directiva lo ve en Cobros y lo marca entregado.
    entrarComoDirectiva();
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("h2", "Recibos en papel por entregar").should("exist");
    cy.contains("article", nombre)
      .should("contain.text", "Hora preferida: Tarde, de 2:00 p. m. a 6:00 p. m.")
      .and("contain.text", "Nota: Tocar el timbre dos veces");
    cy.revisarAccesibilidad("cobros-recibos-en-papel-360");
    cy.contains("article", nombre).contains("a", "Ver para imprimir").should("have.attr", "target", "_blank");
    cy.esperarHidratacion("Marcar como entregado").click();
    cy.contains("article", nombre)
      .contains('[role="status"]', "Recibo marcado como entregado")
      .should("exist");
    cy.reload();
    cy.verTodos();
    cy.contains("article", nombre).should("not.exist");
  });

  it("@HU-COB-12 el recibo en modo Senior tiene pocos objetivos por pantalla, y el mediador lo ve sin enviarlo", () => {
    const nombre = `Vecina Recibo Senior ${sufijo}`;
    vecinaConPago(nombre);
    entrarComoDirectiva();
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    aprobarElPago(nombre);
    objetivosEnSenior("pago aprobado con recibo");
    cy.contains("a", "Descargar el PDF")
      .invoke("attr", "href")
      .then((href) => {
        const reciboId = /recibos\/([^/]+)\/pdf/.exec(href as string)![1];
        cy.contains("button", `Enviarlo a la app de ${nombre}`).click();
        cy.contains('[role="status"]', "Recibo enviado").should("exist");

        cy.visit(`/directiva/cobros/recibos/${reciboId}`);
        cy.get("h1")
          .invoke("text")
          .should("match", /^Recibo N\.° \d{6}$/);
        cy.contains("Recibo oficial en PDF. No se puede modificar.").should("exist");
        cy.contains(`Enviado a la app de ${nombre} el`).should("exist");
        objetivosEnSenior("recibo oficial");
        cy.revisarAccesibilidad("recibo-oficial-senior-360");

        volverComoVecina();
        cy.visit(`/cuota/recibos/${reciboId}`);
        objetivosEnSenior("recibo de la vecina");
        cy.revisarAccesibilidad("recibo-vecina-senior-360");
        cy.visit(`/cuota/recibo-en-papel?recibo=${reciboId}`);
        cy.contains("button", /Recibo N\.° \d{6} · S\/ 7\.50/).should("exist");
        objetivosEnSenior("pedir recibo en papel");
        cy.revisarAccesibilidad("recibo-papel-senior-360");

        cy.clearCookies();
        cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
        cy.visit(`/directiva/cobros/recibos/${reciboId}`);
        cy.get("h1")
          .invoke("text")
          .should("match", /^Recibo N\.° \d{6}$/);
        cy.contains("a", "Ver para imprimir y entregar en su casa").should("exist");
        cy.contains("button", "Enviarlo a la app").should("not.exist");
        cy.request({
          method: "POST",
          url: `/api/aportes/recibos/${reciboId}/enviar`,
          failOnStatusCode: false,
        })
          .its("status")
          .should("eq", 403);
      });
  });

  it("@HU-COB-12 AC-7 otra casa no abre el recibo de la vecina y la API responde 404", () => {
    const nombre = `Vecina Ajena ${sufijo}`;
    vecinaConPago(nombre);
    entrarComoDirectiva();
    cy.viewport(360, 800);
    aprobarElPago(nombre);
    cy.contains("a", "Descargar el PDF")
      .invoke("attr", "href")
      .then((href) => {
        const reciboId = /recibos\/([^/]+)\/pdf/.exec(href as string)![1];
        cy.contains("button", `Enviarlo a la app de ${nombre}`).click();
        cy.contains('[role="status"]', "Recibo enviado").should("exist");
        cy.entrarComoVecinaNueva(`Otra Vecina ${sufijo}`);
        cy.request({ url: `/api/aportes/recibos/${reciboId}/pdf`, failOnStatusCode: false })
          .its("status")
          .should("eq", 404);
        cy.request({ url: `/cuota/recibos/${reciboId}`, failOnStatusCode: false })
          .its("status")
          .should("eq", 404);
      });
  });
});
