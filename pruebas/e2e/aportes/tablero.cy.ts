export {};

// Recaudación (DIR-COB-18 y el bloque del resumen, DIR-INI-01; HU-COB-13). Cada prueba empadrona a una vecina nueva con una cuota
// muy atrasada (atraso crítico) y le crea un cobro con su recibo; lo que suma el tablero tiene que subir exactamente lo cobrado.
// La BD de pruebas ya trae los cobros de las demás pruebas: se comparan las diferencias, no los totales.

const sufijo = String(Date.now()).slice(-6);
const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 };
const OBJETIVOS = "a:visible, button:visible, input:visible:not([type=hidden]), textarea:visible";

/** «S/ 1,840.00» → 184000 céntimos. */
const centimos = (texto: string) => Math.round(Number(texto.replace(/[^0-9.]/g, "")) * 100);

const entrarComo = (dni: string, politica: boolean) => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni, clave: "clave-de-prueba" }).its("status").should("eq", 200);
  if (politica) cy.request("POST", "/api/auth/politica", { acepto: true });
};

const seCobro = () =>
  cy
    .contains("dt", "Se cobró")
    .next("dd")
    .invoke("text")
    .then((t) => centimos(t));

/** Lo que suma el tablero para ese estado de casas, en este mes. */
const totalDe = (estado: string) => {
  cy.visit(`/directiva/cobros/recaudacion?estado=${estado}`);
  cy.get("h1").should("have.text", "Recaudación");
  return seCobro();
};

describe("@HU-COB-13 Recaudación", { defaultCommandTimeout: 15000 }, () => {
  it("@HU-COB-13 CA1 CA2 CA3 la directiva ve lo cobrado, filtra por estado y periodo, y siempre cuadra", () => {
    const nombre = `Vecina Con Atraso Critico ${sufijo}`;
    cy.entrarComoVecinaNueva(nombre).then(({ dni }) => {
      cy.wrap(dni).as("dni");
      cy.task("emitirCuotas", {
        dni,
        cuotas: [{ periodo: "2026-01-05", estado: "VENCIDA", lineas: [CASA] }],
      });
    });
    entrarComo("40000002", true);
    cy.viewport(360, 800);

    // DIR-INI-01: el bloque de recaudación del resumen.
    cy.visit("/directiva");
    cy.contains("h2", "Recaudación").should("exist");
    cy.contains("dt", "Se cobró").should("exist");
    cy.contains("dt", "Falta cobrar").should("exist");
    cy.contains("h3", "Estado de las casas").should("exist");
    cy.contains("li", "Al día:").should("exist");
    cy.contains("li", "Atraso de 1 a 7 semanas:").should("exist");
    cy.contains("li", "8 semanas o más:").should("contain.text", "casas");
    cy.contains('[role="status"]', "Cuadra").should("exist");
    cy.revisarAccesibilidad("resumen-recaudacion-360");
    cy.contains("a", "Ver la recaudación completa").click();

    // DIR-COB-18: el tablero.
    cy.get("h1").should("have.text", "Recaudación");
    cy.contains("Suma los recibos digitales y en efectivo del periodo elegido.").should("exist");
    cy.contains("dt", "Recibos emitidos").should("exist");
    cy.contains("dt", "Falta cobrar").should("exist");
    cy.contains('[role="status"]', "Cuadra").should("exist");
    cy.contains("figcaption", "Lo cobrado cada semana, por medio de pago").should("exist");
    cy.contains("Los mismos datos del gráfico").should("exist");
    cy.revisarAccesibilidad("recaudacion-360");

    // CA3: el total de la tabla por semana es lo cobrado.
    cy.get("tfoot td")
      .last()
      .invoke("text")
      .then((total) =>
        seCobro().then((cobrado) => expect(centimos(total), "tabla = lo cobrado").to.eq(cobrado)),
      );

    // CA1 y CA2: un cobro nuevo en una casa en atraso crítico sube lo cobrado de «todas» y de «8 semanas o más», y no el de «al día».
    const MONTO = 12345;
    totalDe("TODAS").then((todasAntes) =>
      totalDe("CRITICO").then((criticasAntes) =>
        totalDe("AL_DIA").then((alDiaAntes) => {
          cy.get<string>("@dni").then((dni) =>
            cy.task("reciboDePrueba", { dni, monto: MONTO, medio: "EFECTIVO" }),
          );
          totalDe("TODAS").should("eq", todasAntes + MONTO);
          totalDe("CRITICO").should("eq", criticasAntes + MONTO);
          totalDe("AL_DIA").should("eq", alDiaAntes);
        }),
      ),
    );

    // Los filtros se eligen en hojas y quedan en la dirección.
    cy.visit("/directiva/cobros/recaudacion");
    cy.contains("button", "Todas las casas").click();
    cy.contains("button", "8 semanas o más").click();
    cy.location("search").should("contain", "estado=CRITICO");
    cy.contains("button", "8 semanas o más").should("exist");
    cy.get("#campo-periodo").click();
    cy.contains("button", /^Del 1 de .* al /).click();
    cy.location("search").should("contain", "periodo=tres-meses").and("contain", "estado=CRITICO");
    cy.contains('[role="status"]', "Cuadra").should("exist");
    cy.contains("li", "Digital (Yape, Plin, transferencia)").should("exist");
    cy.revisarAccesibilidad("recaudacion-filtrada-360");
  });

  it("@HU-COB-13 el mediador lo ve en vista grande con pocos objetivos; el vecino no entra", () => {
    // Otra prueba (Equipo) le da a Pedro el rol de Directiva: aquí vuelve a ser mediador, sin depender del orden.
    cy.task("rolDePrueba", { dni: "40000003", rol: "DIRECTIVO_MEDIADOR" });
    entrarComo("40000003", false);
    cy.guardarModo("senior");
    cy.viewport(360, 800);
    cy.visit("/directiva/cobros/recaudacion");
    cy.get("h1").should("have.text", "Recaudación");
    cy.get("main").then(($main) =>
      expect($main.find(OBJETIVOS).length, "objetivos en la recaudación").to.be.lte(6),
    );
    cy.revisarAccesibilidad("recaudacion-senior-360");
    cy.request("/api/aportes/tablero").its("status").should("eq", 200);

    cy.entrarComoVecinaNueva(`Vecina Sin Tablero ${sufijo}`);
    cy.request({ url: "/api/aportes/tablero", failOnStatusCode: false }).its("status").should("eq", 403);
  });
});
