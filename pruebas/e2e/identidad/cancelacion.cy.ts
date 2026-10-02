export {};

// Cancelar mi cuenta (VEC-ACC-15) y resolverla (ADM-ARC-04 y 05); oposición a mostrar la ubicación
// exacta (VEC-ACC-13). La cancelación se hace con una vecina ficticia nueva: aprobarla borra sus datos.

describe("@HU-GAR-14 @HU-GAR-15 Cancelación de la cuenta y oposición", () => {
  it("@HU-GAR-15 CA1 activa y retira la oposición; se guarda al tocar", () => {
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    cy.visit("/mas/perfil");
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "false");
    cy.esperarHidratacion("No mostrar mi ubicación exacta en el mapa").click();
    cy.contains('[role="status"]', "Guardado").should("contain.text", "también los anteriores");
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "true");
    cy.revisarAccesibilidad("perfil-oposicion-normal");
    cy.reload();
    cy.get('[role="switch"]').should("have.attr", "aria-checked", "true");
    cy.esperarHidratacion("No mostrar mi ubicación exacta en el mapa").click();
    cy.contains('[role="status"]', "volverán a mostrarse en el punto exacto").should("exist");
  });

  it("@HU-GAR-14 CA1 CA2 CA3 pide la cancelación; la administración la aprueba y la cuenta se cierra", () => {
    cy.entrarComoVecinaNueva("Nora Ruiz Pinto");
    cy.visit("/mas/perfil");
    cy.contains("a", "Pedir que cancelen mi cuenta").click();
    cy.get("h1").should("have.text", "¿Desea pedir que cancelen su cuenta?");
    cy.esperarHidratacion("Sí, pedir la cancelación").click();
    cy.contains("Elija por qué la cancela.").should("exist");
    cy.revisarAccesibilidad("cancelar-cuenta-normal");
    cy.contains("label", "Me mudé del barrio").click();
    cy.contains("button", "Sí, pedir la cancelación").click();
    cy.contains('[role="status"]', "Recibimos su pedido de cancelación").should("exist");
    cy.contains('[role="status"]', "Pidió cancelar su cuenta").should("exist");

    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000001", clave: "clave-de-prueba" });
    cy.visit("/administracion/privacidad?tipo=CANCELACION");
    cy.contains("li", "Nora Ruiz Pinto").contains("a", "Resolver").click();
    cy.get("h1").should("have.text", "Cancelar la cuenta de Nora Ruiz Pinto");
    cy.contains("section", "Se borra o se anonimiza").should("contain.text", "DNI");
    cy.contains("section", "Se conserva, porque lo exige la ley").should("contain.text", "Recibos y pagos");
    cy.revisarAccesibilidad("resolver-cancelacion-normal");
    cy.contains("label", "Aprobar la cancelación").click();
    cy.esperarHidratacion("Revisar la decisión").click();
    cy.get("h1").should("have.text", "¿Desea aprobar la cancelación de Nora Ruiz Pinto?");
    cy.contains('[role="alert"], [role="status"]', "Esto no se puede deshacer").should("exist");
    cy.revisarAccesibilidad("cancelacion-confirmar-normal");
    cy.contains("button", "Sí, aprobar la cancelación").click();
    cy.contains('[role="status"]', "Resolvimos la solicitud").should("exist");
    cy.contains("li", "Persona anonimizada").should("contain.text", "Aprobada");
  });
});
