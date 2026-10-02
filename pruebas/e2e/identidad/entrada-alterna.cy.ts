export {};

// Entrar sin el enlace original (VEC-ACC-04 a 07): pedir uno nuevo, entrar con la clave de
// respaldo, la pausa y crear una clave nueva. Personas de las semillas ficticias; los enlaces se
// toman de la cola (en las pruebas no salen a WhatsApp).

const enlaceDe = (telefono: string, plantilla = "enlace_acceso") =>
  cy.task<string>("enlaceEnCola", { telefono, plantilla }).then((enlace) => new URL(enlace).pathname);

describe("@HU-GAR-11 @HU-GAR-24 @HU-GAR-25 Entrada alterna del vecino", () => {
  beforeEach(() => cy.clearCookies());

  it("@HU-GAR-11 CA1 CA2 CA3 pide un enlace nuevo con su casa y entra con él", () => {
    cy.visit("/entrar");
    cy.revisarAccesibilidad("entrar-opciones-normal");
    cy.contains("a", "Pedir un enlace nuevo").click();
    cy.get("h1").should("have.text", "Pedir un enlace nuevo");
    cy.esperarHidratacion("Enviar un enlace nuevo").click();
    cy.get("#campo-identificador-error").should("contain.text", "Escriba su DNI (8 números) o su casa");
    cy.focused().should("have.id", "campo-identificador");
    cy.revisarAccesibilidad("enlace-nuevo-error-normal");
    // La respuesta es la misma esté o no en el padrón: no revela quién vive dónde.
    cy.get("#campo-identificador").type("99999999");
    cy.contains("button", "Enviar un enlace nuevo").click();
    cy.contains('[role="status"]', "Si sus datos están en el padrón, le enviamos un enlace").should("exist");
    cy.get("#campo-identificador").clear().type("Mz. D lote 9");
    cy.contains("button", "Enviar un enlace nuevo").click();
    cy.contains('[role="status"]', "Revise su WhatsApp. El enlace anterior ya no sirve.").should("exist");
    cy.revisarAccesibilidad("enlace-nuevo-enviado-normal");

    enlaceDe("51900000008").then((ruta) => {
      cy.visit(ruta);
      // El enlace entra solo al abrirse.
      cy.location("pathname").should("eq", "/entrar/privacidad");
    });
  });

  it("@HU-GAR-25 CA1 CA2 CA3 @HU-GAR-24 CA1 CA2 CA3 crea una clave nueva por WhatsApp, entra con ella y ve la pausa", () => {
    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.visit("/clave");
    cy.get("h1").should("have.text", "Entrar con mi clave");
    cy.revisarAccesibilidad("entrar-clave-senior");
    cy.contains("a", "Olvidé mi clave: crear una nueva").click();
    cy.get("h1").should("have.text", "Crear una clave nueva");
    cy.esperarHidratacion("Enviarme el enlace");
    cy.get("#campo-identificador").type("40000007");
    cy.contains("button", "Enviarme el enlace").click();
    cy.contains('[role="status"]', "Si sus datos están en el padrón, le enviamos un enlace").should("exist");
    cy.revisarAccesibilidad("clave-nueva-enviado-senior");

    enlaceDe("51900000007", "clave_nueva").then((ruta) => {
      cy.visit(ruta);
      cy.get("h1").should("have.text", "Rosa, escriba su clave nueva");
      cy.revisarAccesibilidad("clave-nueva-formulario-senior");
      cy.esperarHidratacion("Guardar mi clave nueva");
      cy.get("#campo-clave").type("rosa-clave-1");
      cy.contains("button", "Guardar mi clave nueva").click();
      cy.location("pathname").should("eq", "/entrar/privacidad");

      // El enlace ya se usó.
      cy.visit(ruta);
      cy.get("h1").should("have.text", "Este enlace ya no sirve");
    });

    // HU-GAR-24: entra con su DNI y su clave nueva.
    cy.clearCookie("sesion");
    cy.visit("/clave");
    cy.esperarHidratacion("Entrar con mi clave");
    cy.get("#campo-dni").type("40000007");
    cy.get("#campo-clave").type("rosa-clave-1");
    cy.contains("button", "Entrar con mi clave").click();
    cy.location("pathname").should("eq", "/entrar/privacidad");

    // CA3: cinco fallos seguidos pausan la entrada con clave y sugieren el enlace.
    cy.clearCookie("sesion");
    cy.visit("/clave");
    cy.esperarHidratacion("Entrar con mi clave");
    cy.get("#campo-dni").type("40000007");
    for (let i = 0; i < 5; i++) {
      cy.get("#campo-clave").clear().type("no-es-la-clave");
      cy.contains("button", "Entrar con mi clave").click();
      cy.contains("button", "Entrar con mi clave").should("not.have.attr", "aria-busy");
    }
    cy.contains('[role="status"]', "Su cuenta está bien").should(
      "contain.text",
      "queda en pausa por 15 minutos",
    );
    cy.contains("a", "Recibir un enlace por WhatsApp").should("have.attr", "href", "/entrar/enlace-nuevo");
    cy.revisarAccesibilidad("clave-en-pausa-senior");
  });
});
