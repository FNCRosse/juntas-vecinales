export {};

// Actualizar el predio (ADM-PAD-08, 09) y dar de baja a un residente (ADM-PAD-10, 11), sobre una
// vivienda que el propio caso empadrona por la API.

const sufijo = String(Date.now()).slice(-6);
const LOTE = `7${sufijo.slice(-3)}`;

describe("@HU-GAR-10 @HU-GAR-09 Gestión del padrón", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
  });

  it("@HU-GAR-10 CA1 CA3 @HU-GAR-09 CA1 CA2 CA3 actualiza la ocupación y da de baja al inquilino, con historial", () => {
    cy.request("POST", "/api/admin/padron/empadronar", {
      vivienda: {
        manzana: "G",
        lote: LOTE,
        uso: "VIVIENDA",
        familias: 1,
        inquilinos: 1,
        autos: 0,
        motos: 0,
        triciclos: 0,
        negocios: 0,
      },
      titular: {
        nombreCompleto: "Sofía Castro Ríos",
        dni: `2${sufijo}1`,
        dniVisto: true,
        telefono: `9${sufijo}71`,
      },
      otros: [
        {
          nombreCompleto: "Miguel Paz",
          dni: `2${sufijo}2`,
          dniVisto: true,
          relacion: "OTRO",
          cuentaPropia: true,
          telefono: `9${sufijo}72`,
        },
      ],
    }).then(({ body }) => {
      cy.visit(`/administracion/padron/${body.predioId}`);
    });
    cy.contains("a", "Actualizar los datos del predio").click();
    cy.get("h1").should("have.text", `Actualizar los datos de Mz. G, lote ${LOTE}`);
    cy.esperarHidratacion("Revisar el cambio").click();
    cy.contains('[role="status"]', "No cambió ningún dato").should("exist");
    cy.get('button[aria-label="Agregar uno: Motos"]').click();
    cy.revisarAccesibilidad("predio-actualizar-normal");
    cy.contains("button", "Revisar el cambio").click();
    cy.contains("dd", "0 → 1").should("exist");
    cy.revisarAccesibilidad("predio-actualizar-confirmar-normal");
    cy.contains("button", "Sí, guardar los cambios").click();
    cy.contains('[role="status"]', "Datos guardados").should("exist");
    cy.contains("li", "Actualizó los datos: motos 0 → 1").should("contain.text", "Ana Flores");

    cy.viewport(360, 800);
    cy.guardarModo("senior");
    cy.contains("a", "Dar de baja a un residente").click();
    cy.esperarHidratacion("Revisar").click();
    cy.get("#campo-quien-error").should("have.text", "Elija a quién dar de baja.");
    cy.contains("label", "Miguel Paz").click();
    cy.contains("label", "Se mudó del barrio").click();
    cy.revisarAccesibilidad("residente-baja-senior-360");
    cy.contains("button", "Revisar").click();
    cy.get("h1").should("have.text", "¿Desea dar de baja a Miguel Paz?");
    cy.contains('[role="alert"]', "Se cierra su sesión y sale de la lista de la garita").should("exist");
    cy.revisarAccesibilidad("residente-baja-confirmar-senior-360");
    cy.contains("button", "Sí, dar de baja").click();
    cy.contains('[role="status"]', "Dimos de baja a Miguel Paz").should("exist");
    cy.contains("li", "Dio de baja a Miguel Paz: se mudó del barrio").should("exist");
    cy.get("main").should("not.contain.text", "Otro familiar o inquilino · DNI");
    cy.revisarAccesibilidad("ficha-historial-senior-360");
  });
});
