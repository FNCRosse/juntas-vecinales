export {};

// Cuentas del equipo (ADM-EQU-01 a 08, ADM-ENT-02): agregar a alguien del padrón y a alguien de
// afuera, la invitación por WhatsApp (tomada de la cola), cambiar el rol y quitar el acceso.

const CLAVE = "clave-de-prueba";
const sufijo = String(Date.now()).slice(-6);
const DNI_EXTERNO = `3${sufijo}9`;
const TELEFONO_EXTERNO = `9${sufijo}55`;

const entrarComoAna = () =>
  cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: CLAVE }).its("status").should("eq", 200);

describe("@HU-GAR-21 @HU-GAR-22 @HU-GAR-23 Cuentas del equipo", () => {
  beforeEach(() => {
    cy.clearCookies();
    entrarComoAna();
  });

  it("@HU-GAR-21 CA1 CA2 CA3 da acceso a un vecino del padrón y la persona crea su clave de equipo", () => {
    cy.visit("/administracion/equipo");
    cy.get("h1").should("have.text", "Cuentas del equipo");
    cy.get("table caption").should("contain.text", "Sí: el rol lo puede hacer.");
    cy.revisarAccesibilidad("equipo-normal");
    cy.contains("a", "Agregar a una persona").click();

    cy.esperarHidratacion("Revisar").click();
    cy.get("#campo-buscar-error").should("contain.text", "Busque a la persona en el padrón");
    cy.get("#campo-buscar").type("40000006");
    cy.contains("button", "Buscar en el padrón").click();
    cy.contains("h2", "Julio Mendoza").should("exist");
    cy.contains("dd", "Mz. A, lote 3").should("exist");
    cy.contains("label", "Directivo mediador").click();
    cy.contains("li", "Registrar por un vecino y atender pedidos de ayuda").should("exist");
    cy.revisarAccesibilidad("equipo-agregar-normal");
    cy.contains("button", "Revisar").click();

    cy.get("h1").should("have.text", "¿Desea dar acceso de equipo a Julio Mendoza?");
    cy.focused().should("match", "h1");
    cy.revisarAccesibilidad("equipo-agregar-confirmar-normal");
    cy.contains("button", "Sí, dar acceso").click();
    cy.get("h1").should("have.text", "Julio Mendoza ya es parte del equipo");
    cy.contains('[role="status"]', "Invitación enviada a Julio Mendoza").should("exist");
    cy.revisarAccesibilidad("equipo-agregado-normal");
  });

  it("@HU-GAR-23 CA1 CA2 CA3 cambia el rol mostrando qué permisos gana y pierde", () => {
    cy.visit("/administracion/equipo");
    cy.contains("li", "Pedro Chávez").contains("a", "Cambiar rol").click();
    cy.get("h1").should("have.text", "Cambiar el rol de Pedro Chávez");
    cy.esperarHidratacion("Revisar el cambio").click();
    cy.contains('[role="status"]', "Elija otro rol para cambiarlo.").should("exist");
    cy.contains("label", "Directiva").click();
    cy.contains("h3", "Podrá hacer desde ahora").should("exist");
    cy.contains("h3", "Sigue pudiendo").should("exist");
    cy.revisarAccesibilidad("equipo-rol-normal");
    cy.contains("button", "Revisar el cambio").click();
    cy.get("h1").should("have.text", "¿Desea cambiar el rol de Pedro Chávez?");
    cy.contains("button", "Sí, cambiar el rol").click();
    cy.location("pathname").should("eq", "/administracion/equipo");
    cy.contains('[role="status"]', "Pedro Chávez ahora es Directiva").should("exist");
  });

  it("@HU-GAR-22 CA1 CA2 CA3 en modo Senior: agrega a alguien de afuera y le quita el acceso con confirmación de peligro", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.request("POST", "/api/admin/cuentas", {
      persona: { tipo: "afuera", nombreCompleto: "Raúl Vega", dni: DNI_EXTERNO, telefono: TELEFONO_EXTERNO },
      rol: "VIGILANTE",
    })
      .its("status")
      .should("eq", 201);
    cy.visit("/administracion/equipo");
    cy.contains("li", "Raúl Vega")
      .should("contain.text", "Personal externo")
      .and("contain.text", "Invitación enviada");
    cy.revisarAccesibilidad("equipo-senior-360");
    cy.contains("li", "Raúl Vega").contains("a", "Quitar acceso").click();
    cy.esperarHidratacion("Revisar").click();
    cy.get("#campo-motivo-error").should("have.text", "Elija por qué se le quita el acceso.");
    cy.contains("label", "Terminó su contrato").click();
    cy.revisarAccesibilidad("equipo-quitar-senior-360");
    cy.contains("button", "Revisar").click();
    cy.get("h1").should("have.text", "¿Desea quitarle el acceso a Raúl Vega?");
    cy.contains('[role="alert"]', "Su sesión se cierra de inmediato").should("exist");
    cy.revisarAccesibilidad("equipo-quitar-confirmar-senior-360");
    cy.contains("button", "Sí, quitar el acceso").click();
    cy.contains('[role="status"]', "Quitamos el acceso a Raúl Vega").should("exist");
    cy.contains("li", "Raúl Vega").should("not.exist");
  });
});

describe("@HU-GAR-21 Crear el acceso de equipo con la invitación", () => {
  it("@HU-GAR-21 CA2 crea su clave de equipo y entra a su rol", () => {
    cy.clearCookies();
    cy.task<string>("enlaceEnCola", { telefono: "51900000006", plantilla: "invitacion_equipo" }).then(
      (enlace) => {
        expect(enlace, "la invitación de Julio del primer caso").to.be.a("string");
        cy.visit(new URL(enlace).pathname);
        cy.get("h1").should("have.text", "Crear su acceso de equipo");
        cy.get("#campo-dni").should("have.value", "40000006");
        cy.revisarAccesibilidad("crear-acceso-equipo-normal");
        cy.esperarHidratacion("Crear mi acceso");
        cy.get("#campo-clave").type("corta");
        cy.contains("button", "Crear mi acceso").click();
        cy.get("#campo-clave-error").should("contain.text", "al menos 12 caracteres");
        cy.get("#campo-clave").clear().type("clave-de-equipo-larga");
        cy.contains("button", "Crear mi acceso").click();
        cy.location("pathname").should("eq", "/directiva");
      },
    );
  });

  it("@HU-GAR-21 CA2 el administrador genera un enlace para copiar y la persona crea su clave con él", () => {
    cy.clearCookies();
    entrarComoAna();
    cy.request("POST", "/api/admin/cuentas", {
      persona: {
        tipo: "afuera",
        nombreCompleto: "Gloria Paz Rey",
        dni: `4${sufijo}8`,
        telefono: `9${sufijo}66`,
      },
      rol: "DIRECTIVA",
    });
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/administracion/equipo");
    cy.contains("li", "Gloria Paz Rey").within(() => {
      cy.esperarHidratacion("Generar enlace para copiar (Gloria Paz Rey)").click();
    });
    cy.contains("li", "Gloria Paz Rey")
      .find("input[readonly]")
      .should("have.attr", "value")
      .and("match", /\/entrar\/equipo\/crear\//);
    cy.contains("li", "Gloria Paz Rey").should("contain.text", "Sirve una sola vez");
    cy.revisarAccesibilidad("equipo-enlace-senior-360");
    cy.contains("li", "Gloria Paz Rey")
      .find("input[readonly]")
      .invoke("val")
      .then((url) => {
        cy.clearCookies();
        cy.visit(new URL(String(url)).pathname);
        cy.get("h1").should("have.text", "Crear su acceso de equipo");
        cy.guardarModo("normal");
      });
  });
});
