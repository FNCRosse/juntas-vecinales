export {};

// Primer ingreso del vecino (VEC-ACC-01 a 03): enlace de un solo uso, política y clave opcional.
// La administradora empadrona por la API y el enlace se toma de la cola (no sale a WhatsApp).

const CLAVE = "clave-de-prueba";
const sufijo = String(Date.now()).slice(-6);

function empadronar(lote: string, dni: string, telefono: string) {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: CLAVE });
  cy.request("POST", "/api/admin/padron/empadronar", {
    vivienda: {
      manzana: "E",
      lote,
      uso: "VIVIENDA",
      familias: 1,
      inquilinos: 0,
      autos: 0,
      motos: 0,
      triciclos: 0,
      negocios: 0,
    },
    titular: { nombreCompleto: "Sofía Castro Ríos", dni, dniVisto: true, telefono },
  });
  cy.clearCookies();
  return cy.task<string>("enlaceEnCola", `51${telefono}`).then((enlace) => new URL(enlace).pathname);
}

describe("@HU-GAR-02 Entrar con el enlace de acceso", () => {
  it("@HU-GAR-02 CA1 CA2 CA3 @HU-ACC-01 entra sin clave, acepta la política, crea su clave y conserva Letra grande", () => {
    empadronar(`1${sufijo.slice(-3)}`, `6${sufijo}1`, `9${sufijo}01`).then((ruta) => {
      // Antes de entrar elige Letra grande en este dispositivo (HU-ACC-01).
      cy.guardarModo("senior");
      // La página envía el enlace sola; el primer intento se simula fallido para ver la
      // bienvenida y el botón de respaldo.
      cy.intercept(
        { method: "POST", url: "/api/auth/canjear", times: 1 },
        {
          statusCode: 503,
          body: { error: "No pudimos conectarnos. Revise su internet y vuelva a intentarlo." },
        },
      );
      cy.visit(ruta);
      cy.get("h1").should("have.text", "Le damos la bienvenida, Sofía");
      cy.contains('[role="alert"]', "No pudimos hacerle entrar").should("exist");
      cy.contains("p", `Mz. E, lote 1${sufijo.slice(-3)}`).should("exist");
      cy.revisarAccesibilidad("entrar-enlace-senior");
      cy.contains("button", "Entrar a mi cuenta").click();

      cy.location("pathname").should("eq", "/entrar/privacidad");
      cy.get("h1").should("have.text", "Cómo cuidamos sus datos");
      cy.contains("button", "Aceptar y continuar").click();
      cy.get('[id="campo-acepto-error"]').should(
        "contain.text",
        "Para continuar, marque la casilla de arriba.",
      );
      cy.revisarAccesibilidad("privacidad-error-senior");
      cy.contains("label", "Leí y acepto la política de privacidad").click();
      cy.contains("button", "Aceptar y continuar").click();

      cy.location("pathname").should("eq", "/entrar/clave-respaldo");
      cy.get("#campo-dni").should("have.value", `DNI terminado en ${sufijo.slice(-1)}1`);
      cy.revisarAccesibilidad("clave-respaldo-senior");
      cy.get("#campo-clave").type("123");
      cy.contains("button", "Crear mi clave").click();
      cy.get("#campo-clave-error").should("have.text", "La clave necesita al menos 6 números o letras.");
      cy.get("#campo-clave").clear().type("mi-clave-1");
      cy.contains("button", "Crear mi clave").click();

      cy.location("pathname").should("eq", "/");
      cy.get("h1").should("contain.text", "Sofía");
      cy.get("html").should("have.attr", "data-mode", "senior");
      cy.revisarAccesibilidad("inicio-vecino-senior");

      // Desde otro dispositivo (sin la cookie del perfil), el modo sigue: está en la cuenta.
      cy.clearCookie("perfil");
      cy.reload();
      cy.get("html").should("have.attr", "data-mode", "senior");

      // El enlace ya se usó: abrirlo otra vez no deja entrar.
      cy.clearCookies();
      cy.visit(ruta);
      cy.get("h1").should("have.text", "Este enlace ya no sirve");
      cy.revisarAccesibilidad("enlace-usado-normal");
    });
  });

  it("@HU-GAR-02 CA2 sin aceptar la política el vecino no llega a su inicio; puede leerla completa", () => {
    empadronar(`2${sufijo.slice(-3)}`, `6${sufijo}2`, `9${sufijo}02`).then((ruta) => {
      cy.viewport(360, 800);
      cy.guardarModo("normal");
      // Al abrir el enlace en el navegador, entra solo (HU-GAR-02 CA1).
      cy.visit(ruta);
      cy.location("pathname").should("eq", "/entrar/privacidad");
      cy.revisarAccesibilidad("privacidad-normal-360");
      cy.visit("/");
      cy.location("pathname").should("eq", "/entrar/privacidad");
      cy.contains("a", "Leer la política de privacidad completa").click();
      cy.get("h1").should("have.text", "Política de privacidad");
      cy.revisarAccesibilidad("politica-completa-normal-360");
    });
  });

  it("@HU-GAR-02 sin sesión, el inicio del vecino lleva a la entrada", () => {
    cy.clearCookies();
    cy.visit("/");
    cy.location("pathname").should("eq", "/entrar");
    cy.get("h1").should("have.text", "Entrar a su cuenta");
  });
});
