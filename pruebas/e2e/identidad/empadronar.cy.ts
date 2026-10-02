export {};

// Empadronar una vivienda (ADM-PAD-01 a ADM-PAD-07). La administradora sale de las semillas
// ficticias; el lote y los DNI nuevos cambian en cada corrida para poder repetirla.

const CLAVE = "clave-de-prueba";
const sufijo = String(Date.now()).slice(-6);
const LOTE = `9${sufijo.slice(-3)}`;
const DNI_TITULAR = `7${sufijo}1`;
const DNI_OTRO = `7${sufijo}2`;
const porId = (id: string) => cy.get(`[id="${id}"]`);

const entrarComoAna = () =>
  cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: CLAVE }).its("status").should("eq", 200);

describe("@HU-GAR-01 Empadronar una vivienda", () => {
  beforeEach(() => {
    cy.clearCookies();
    entrarComoAna();
  });

  it("@HU-GAR-01 CA1 CA2 CA3 la administradora empadrona con verificación del DNI y se envían los enlaces", () => {
    cy.visit("/administracion/padron");
    cy.get("h1").should("have.text", "Padrón de viviendas y residentes");
    cy.contains("a", "Mz. C, lote 7").should("exist");
    cy.revisarAccesibilidad("padron-normal");
    cy.contains("a", "Empadronar una vivienda").click();

    // Paso 1: un lote que ya está en el padrón se avisa con su titular.
    cy.esperarHidratacion("Siguiente: las personas");
    porId("campo-vivienda.manzana").type("c");
    porId("campo-vivienda.lote").type("7");
    cy.get('button[aria-label="Agregar uno: Autos o camionetas"]').click();
    cy.get('[id="campo-vivienda.autos"]').should("have.text", "1");
    cy.contains("button", "Siguiente: las personas").click();
    porId("campo-vivienda.lote-error").should("contain.text", "es de Carmen Huamán");
    cy.focused().should("have.attr", "role", "alert");
    cy.revisarAccesibilidad("empadronar-paso1-errores-normal");
    porId("campo-vivienda.lote").clear().type(LOTE);
    cy.contains("button", "Siguiente: las personas").click();

    // Paso 2: sin ver el DNI no avanza; un DNI del padrón se bloquea y dice dónde vive.
    cy.get("h1").should("have.text", `¿Quién vive en Mz. C, lote ${LOTE}?`);
    cy.focused().should("match", "h1");
    porId("campo-titular.dni").type("40000006");
    porId("campo-titular.nombreCompleto").type("Sofía Castro Ríos");
    porId("campo-titular.telefono").type("912 345 678");
    cy.contains("button", "Revisar todo").click();
    porId("campo-titular.dniVisto-error").should("contain.text", "Falta confirmar que vio el DNI");
    porId("campo-titular.dni-error").should(
      "contain.text",
      "Este DNI ya está en el padrón: Julio Mendoza, Mz. A, lote 3.",
    );
    cy.revisarAccesibilidad("empadronar-paso2-errores-normal");
    porId("campo-titular.dniVisto").check();
    porId("campo-titular.dni").clear().type(DNI_TITULAR);

    cy.contains("button", "Agregar otra persona").click();
    porId("campo-nuevo.nombreCompleto").type("Manuel Castro Ríos");
    cy.contains("label", "Esposo o esposa").click();
    porId("campo-nuevo.dniVisto").check();
    porId("campo-nuevo.dni").type(DNI_OTRO);
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "true");
    porId("campo-nuevo.telefono").type("912345678");
    cy.contains("button", "Agregar a esta persona").click();
    porId("campo-nuevo.telefono-error").should("contain.text", "Cada cuenta necesita su propio WhatsApp");
    porId("campo-nuevo.telefono").clear().type("912345700");
    cy.revisarAccesibilidad("empadronar-otra-persona-normal");
    cy.contains("button", "Agregar a esta persona").click();
    cy.contains("h3", "Manuel Castro Ríos").should("exist");
    cy.contains("button", "Revisar todo").click();

    // Paso 3: confirmación con el resumen; "Corregir algo" vuelve sin borrar nada.
    cy.get("h1").should("have.text", `¿Desea empadronar Mz. C, lote ${LOTE}?`);
    cy.contains("dd", "Sofía: 912 345 678 · Manuel: 912 345 700").should("exist");
    cy.revisarAccesibilidad("empadronar-confirmar-normal");
    cy.contains("button", "Corregir algo").click();
    porId("campo-titular.nombreCompleto").should("have.value", "Sofía Castro Ríos");
    cy.contains("button", "Revisar todo").click();
    cy.contains("button", "Sí, empadronar").click();

    cy.get("h1").should("have.text", `Mz. C, lote ${LOTE} ya está en el padrón`);
    cy.contains('[role="status"]', "Registrado por Ana Flores").should("exist");
    cy.contains("li", "Manuel Castro Ríos").should("contain.text", "Esposo o esposa");
    cy.revisarAccesibilidad("empadronar-listo-normal");

    cy.contains("a", "Ver la ficha de la vivienda").click();
    cy.get("h1").should("have.text", `Mz. C, lote ${LOTE}`);
    cy.contains("li", "Manuel Castro Ríos").should("contain.text", `DNI ${DNI_OTRO}`);
    cy.revisarAccesibilidad("ficha-vivienda-normal");

    cy.visit(`/administracion/padron?q=${DNI_TITULAR}`);
    cy.get('ul[aria-label="Viviendas"] li').should("have.length", 1).and("contain.text", "Sofía Castro Ríos");
  });

  [
    { modo: "senior", ancho: 360 },
    { modo: "normal", ancho: 360 },
    { modo: "senior", ancho: 1280 },
  ].forEach(({ modo, ancho }) => {
    it(`@HU-GAR-01 el padrón y el asistente cumplen WCAG 2.2 AA en modo ${modo} a ${ancho} px`, () => {
      cy.viewport(ancho, 800);
      cy.guardarModo(modo as "normal" | "senior");
      cy.visit("/administracion/padron?mz=C");
      cy.contains("a", "Mz. C, lote 7").should("exist");
      cy.revisarAccesibilidad(`padron-${modo}-${ancho}`);
      cy.visit("/administracion/padron/empadronar");
      cy.esperarHidratacion("Siguiente: las personas").click();
      porId("campo-vivienda.lote-error").should("exist");
      cy.revisarAccesibilidad(`empadronar-paso1-${modo}-${ancho}`);
      porId("campo-vivienda.manzana").type("Z");
      porId("campo-vivienda.lote").type(`8${sufijo.slice(-3)}`);
      cy.contains("button", "Siguiente: las personas").click();
      cy.contains("button", "Agregar otra persona").click();
      cy.contains("button", "Agregar a esta persona").click();
      porId("campo-nuevo.nombreCompleto-error").should("exist");
      cy.revisarAccesibilidad(`empadronar-paso2-${modo}-${ancho}`);
    });
  });

  it("@HU-GAR-01 solo la administración ve el padrón", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000004", clave: CLAVE });
    cy.visit("/administracion/padron");
    cy.location("pathname").should("eq", "/garita");
  });
});
