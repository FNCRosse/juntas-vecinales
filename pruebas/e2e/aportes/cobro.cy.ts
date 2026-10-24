export {};

// Cobro en efectivo (VEC-COB-02 y 13, DIR-COB-07 a 10; HU-COB-11). Cada prueba empadrona a una vecina nueva y le emite sus
// tres semanas; ella pide por las pantallas que vayan a cobrarle y la directiva (Marta) cobra en su casa, con señal y sin ella.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const SEMANAS = ["2026-09-07", "2026-09-14", "2026-09-21"];
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** Crea una vecina con tres semanas por pagar y guarda su sesión; el cobro lo pide ella por las pantallas. */
function vecinaConCuotas(nombre: string) {
  cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
    cy.task("emitirCuotas", {
      dni,
      cuotas: SEMANAS.map((periodo) => ({ periodo, estado: "PENDIENTE", lineas: [CASA] })),
    });
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

/** La vecina pide, por «Pagar mi cuota», que vayan a cobrarle todo lo pendiente en la mañana. */
function pedirQueVayanACobrar() {
  cy.visit("/cuota/pagar");
  cy.esperarHidratacion("Revisar mi pago");
  cy.contains("button", "Elegir cuánto").click();
  cy.contains("button", "Todo lo pendiente").click();
  cy.contains("button", "Elegir cómo").click();
  cy.contains("button", "En efectivo: que la directiva venga a mi casa").click();
  cy.contains("button", "Elegir la hora").click();
  cy.contains("button", "En la mañana").click();
  cy.contains("button", "Revisar mi pedido").click();
  cy.contains("button", "Sí, pedir que vengan a cobrar").click();
  cy.contains("h1", "Irán a su casa a cobrar").should("exist");
}

const irACobrar = (nombre: string) => {
  cy.visit("/directiva/cobros");
  cy.verTodos();
  // Se abre la dirección del enlace: el clic puede perderse si la lista todavía se está hidratando.
  cy.contains("article", nombre)
    .contains("a", "Ir a cobrar")
    .invoke("attr", "href")
    .then((href) => cy.visit(href as string));
  cy.get("h1").should("have.text", `Cobrar en casa de ${nombre}`);
};

/** Vacía la cola local de cobros: IndexedDB no se borra sola entre pruebas y quedarían cobros de otras corridas. */
const vaciarColaLocal = () =>
  cy.window().then(
    (ventana) =>
      new Promise<void>((resolver) => {
        const borrado = ventana.indexedDB.deleteDatabase("cobros");
        borrado.onsuccess = borrado.onerror = borrado.onblocked = () => resolver();
      }),
  );

/** Cambia lo que el teléfono cree de su señal, como si se fuera o volviera. */
const conSenal = (hay: boolean) =>
  cy.window().then((ventana) => {
    Object.defineProperty(ventana.navigator, "onLine", { configurable: true, get: () => hay });
    ventana.dispatchEvent(new Event(hay ? "online" : "offline"));
  });

const objetivosEnSenior = (ruta: string) => {
  cy.get("main").then(($main) => expect($main.find(OBJETIVOS).length, `objetivos en ${ruta}`).to.be.lte(6));
};

// Registrar un cobro es una transacción en el servidor y una pasada por IndexedDB: se le da más margen que a una pantalla.
describe("@HU-COB-11 Cobro en efectivo", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-11 CA1 la vecina pide que vayan a cobrar y la directiva cobra en su casa con señal: recibo emitido y enviado", () => {
    const nombre = `Vecina En Casa ${sufijo}`;
    vecinaConCuotas(nombre);
    cy.viewport(360, 800);

    // VEC-COB-02: la opción «En efectivo» cambia el formulario, sin foto.
    cy.visit("/cuota/pagar");
    cy.esperarHidratacion("Revisar mi pago");
    cy.contains("button", "Elegir cuánto").click();
    cy.contains("button", "Todo lo pendiente").click();
    cy.contains("button", "Elegir cómo").click();
    cy.contains("button", "En efectivo: que la directiva venga a mi casa").click();
    cy.contains("Una persona de la directiva irá a su casa a recibir el dinero").should("exist");
    cy.contains("strong", "Quién pide:").parent().should("contain.text", nombre);
    cy.get("#campo-archivoId").should("not.exist");
    cy.revisarAccesibilidad("pagar-en-efectivo-360");
    cy.contains("button", "Revisar mi pedido").click();
    cy.get("#campo-franja-error").should("contain.text", "Elija a qué hora le queda mejor que vayan.");
    cy.contains("button", "Elegir la hora").click();
    cy.contains("button", "En la mañana").click();
    cy.get("#campo-nota").type("Tocar el timbre dos veces");
    cy.contains("button", "Revisar mi pedido").click();

    cy.get("h1").should("have.text", "¿Desea pedir que vayan a cobrar?");
    cy.contains("dd", "En efectivo, en su casa").should("exist");
    cy.contains("dd", "Mañana, de 8:00 a. m. a 12:00 m.").should("exist");
    cy.contains("Todavía no se cobra nada.").should("exist");
    cy.revisarAccesibilidad("pedido-cobro-confirmar-360");
    cy.contains("button", "Sí, pedir que vengan a cobrar").click();

    // VEC-COB-13: el pedido enviado.
    cy.get("h1").should("have.text", "Irán a su casa a cobrar");
    cy.contains('[role="status"]', "Pedido enviado a la directiva").should("exist");
    cy.contains("Pedido N.° C-").should("exist");
    cy.contains("Pendiente de visita").should("exist");
    cy.contains("Tenga listo el monto.").should("exist");
    cy.revisarAccesibilidad("pedido-cobro-enviado-360");
    cy.visit("/cuota");
    cy.contains('[role="status"]', "Irán a su casa a cobrar").should(
      "contain.text",
      "Hora preferida: Mañana",
    );

    // DIR-COB-07 y 08: la directiva lo ve en Cobros y cobra otro monto.
    entrarComoDirectiva();
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("h2", "Cobros en casa por atender").should("exist");
    cy.contains("article", nombre)
      .should("contain.text", "S/ 7.50")
      .and("contain.text", "Pendiente de visita");
    cy.revisarAccesibilidad("cobros-en-casa-360");
    cy.contains("article", nombre)
      .contains("a", "Ir a cobrar")
      .invoke("attr", "href")
      .then((href) => cy.visit(href as string));
    cy.get("h1").should("have.text", `Cobrar en casa de ${nombre}`);
    cy.contains("dd", "S/ 7.50").should("exist");
    cy.contains("dd", "3 semanas, del 7 al 27 de setiembre").should("exist");
    cy.contains("a", "para acordar la hora").should("exist");
    cy.revisarAccesibilidad("cobrar-en-casa-360");
    cy.esperarHidratacion("Revisar el cobro");
    cy.contains("button", "Lo que pidió: S/ 7.50").click();
    cy.contains("button", "Otro monto").click();
    cy.get("#campo-monto").type("9");
    cy.contains("button", "Revisar el cobro").click();
    cy.get("#campo-monto-error").should("contain.text", "Es más de lo que debe la casa (S/ 7.50)");
    cy.get("#campo-monto").clear().type("3.00");
    cy.contains("button", "Revisar el cobro").click();

    cy.get("h1").should("have.text", "¿Desea registrar este cobro en efectivo?");
    cy.contains("dd", "S/ 3.00").should("exist");
    cy.contains("dd", "Abono a su deuda de S/ 7.50").should("exist");
    cy.contains("dd", "Efectivo, en su casa").should("exist");
    cy.revisarAccesibilidad("cobro-en-casa-confirmar-360");
    cy.contains("button", "Sí, registrar el cobro").click();

    cy.contains('[role="status"]', "Cobro registrado")
      .should("contain.text", `${nombre} todavía debe S/ 4.50.`)
      .and("contain.text", "Emitimos el recibo N.° ");
    cy.revisarAccesibilidad("cobro-en-casa-hecho-360");
    cy.contains("a", "Ver el recibo").click();
    cy.contains("dd", "Efectivo, en su casa").should("exist");
    cy.contains("dd", "Cuota de vigilancia: 2 semanas, del 7 al 20 de setiembre (abono parcial)").should(
      "exist",
    );

    // La vecina ya no tiene el pedido pendiente y tiene su recibo en Mis pagos.
    volverComoVecina();
    cy.visit("/cuota");
    cy.contains("Irán a su casa a cobrar").should("not.exist");
    cy.contains("p", "S/ 4.50").should("exist");
    cy.visit("/cuota/pagos");
    cy.contains("article", /Recibo N\.° \d{6}/)
      .should("contain.text", "Aprobado")
      .and("contain.text", "Efectivo, en su casa");
  });

  it("@HU-COB-11 CA1 CA2 CA3 sin señal el cobro queda guardado como pendiente y, al volver la señal, se envía sin duplicarse", () => {
    const nombre = `Vecina Sin Senal ${sufijo}`;
    vecinaConCuotas(nombre);
    cy.viewport(360, 800);
    pedirQueVayanACobrar();

    // La señal se va: el envío del cobro falla antes de llegar al servidor.
    let sinSenal = true;
    cy.intercept("POST", "/api/aportes/pagos/presencial", (peticion) => {
      if (sinSenal) peticion.reply({ forceNetworkError: true });
      else peticion.continue();
    }).as("cobrar");
    entrarComoDirectiva();
    irACobrar(nombre);
    vaciarColaLocal();
    conSenal(false);
    cy.contains("Aquí no hay señal de internet").should("exist");
    cy.revisarAccesibilidad("cobrar-sin-senal-360");
    cy.contains("button", "Revisar el cobro").click();
    cy.contains("No hay señal: se guardará en su teléfono y se enviará solo cuando vuelva la señal").should(
      "exist",
    );
    cy.contains("button", "Sí, registrar el cobro").click();

    // CA1: la pantalla dice que quedó guardado, no que se perdió.
    cy.contains('[role="status"]', "Cobro guardado en su teléfono", { timeout: 20000 }).should("exist");
    cy.contains("li", nombre).should("contain.text", "Pendiente de enviar");
    cy.contains("El recibo oficial se genera al enviarlo.").should("exist");
    cy.contains('[role="status"]', "Sin señal de internet").should("exist");
    cy.revisarAccesibilidad("cobro-guardado-sin-senal-360");

    // CA2 y CA3: vuelve la señal y el cobro se envía solo, una sola vez.
    cy.then(() => {
      sinSenal = false;
    });
    conSenal(true);
    // El envío es una transacción en el servidor: se le da más margen que a una pantalla.
    cy.contains("li", nombre, { timeout: 20000 }).should("contain.text", "Enviado");
    cy.contains("li", nombre).contains("a", "Ver el recibo N.°").should("exist");

    cy.visit("/directiva/cobros/guardados");
    cy.contains("li", nombre).should("contain.text", "Enviado");
    cy.revisarAccesibilidad("cobros-guardados-360");

    volverComoVecina();
    cy.visit("/cuota");
    cy.contains("p", "S/ 0.00").should("exist");
    cy.visit("/cuota/pagos");
    cy.contains("article", /Recibo N\.° \d{6}/).and("contain.text", "S/ 7.50");
  });

  it("@HU-COB-11 el mediador no cobra y, en modo Senior, el cobro tiene pocos objetivos por pantalla", () => {
    const nombre = `Vecina Senior ${sufijo}`;
    vecinaConCuotas(nombre);
    cy.viewport(360, 800);
    pedirQueVayanACobrar();

    cy.clearCookies();
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).should("exist").contains("a", "Ir a cobrar").should("not.exist");
    cy.request({
      method: "POST",
      url: "/api/aportes/pagos/presencial",
      body: {
        idOperacionLocal: crypto.randomUUID(),
        pedidoId: crypto.randomUUID(),
        monto: 500,
        reciboEnPapel: false,
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);

    entrarComoDirectiva();
    cy.guardarModo("senior");
    irACobrar(nombre);
    cy.contains("button", "Lo que pidió: S/ 7.50").click();
    cy.contains("button", "Otro monto").click();
    objetivosEnSenior("cobrar en casa con otro monto");
    cy.revisarAccesibilidad("cobrar-en-casa-senior-360");
    cy.visit("/directiva/cobros/guardados");
    objetivosEnSenior("cobros guardados");
    cy.revisarAccesibilidad("cobros-guardados-senior-360");
  });

  it("@HU-COB-11 «Prefiero pagar por Yape o transferencia» cancela el pedido y vuelve a Pagar mi cuota", () => {
    const nombre = `Vecina Cambia ${sufijo}`;
    vecinaConCuotas(nombre);
    cy.viewport(360, 800);
    pedirQueVayanACobrar();
    cy.contains("button", "Prefiero pagar por Yape o transferencia").click();
    cy.contains("h1", "Pagar mi cuota").should("exist");
    cy.contains("button", "Elegir cuánto").should("exist");
    cy.visit("/cuota");
    cy.contains("Irán a su casa a cobrar").should("not.exist");
    entrarComoDirectiva();
    cy.visit("/directiva/cobros");
    cy.verTodos();
    cy.contains("article", nombre).should("not.exist");
  });
});
