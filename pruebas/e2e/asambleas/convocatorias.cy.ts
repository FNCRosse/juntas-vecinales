export {};

// HU-ASA-01: convocatoria con versión imprimible (DIR-ASA-01 a DIR-ASA-04, VEC-ASA-01).
// Marta es directiva y vecina, así que una sola sesión convoca y luego ve la asamblea como vecina.

const sufijo = String(Date.now()).slice(-6);
// Fechas siempre a futuro: la asamblea debe ser posterior a hoy, así que se cuentan desde hoy.
const enDias = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const LUGAR = `Local comunal ${sufijo}`;
const MOTIVO = "Aprobar el presupuesto para cámaras de seguridad en las entradas del barrio.";

const entrarComoMarta = () => {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" })
    .its("status")
    .should("eq", 200);
  cy.request("POST", "/api/auth/politica", { acepto: true });
};

describe("@HU-ASA-01 Convocatoria con versión imprimible", () => {
  before(() => cy.task("reiniciarAsambleas"));
  beforeEach(entrarComoMarta);

  it("@HU-ASA-01 CA1 CA2 CA3 la directiva convoca, revisa y publica el afiche en teléfono", () => {
    cy.viewport(360, 800);
    cy.visit("/directiva/asambleas");
    cy.get("h1").should("have.text", "Asambleas y actividades");
    cy.revisarAccesibilidad("asambleas-directiva-360");

    cy.contains("a", "Convocar una asamblea").click();
    cy.get("h1").should("have.text", "Nueva convocatoria");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("convocatoria-nueva-360");

    cy.esperarHidratacion("Revisar la convocatoria").click();
    cy.contains("Elija si la asamblea es ordinaria o extraordinaria.").should("exist");
    cy.contains("Escriba el lugar de la asamblea.").should("exist");
    cy.contains("Escriba el motivo de la asamblea.").should("exist");
    cy.revisarAccesibilidad("convocatoria-errores-360");

    cy.contains("button", "Elegir el tipo").click();
    cy.contains("button", "Ordinaria").click();
    cy.contains("button", "Elegir fecha y hora").click();
    cy.get("#campo-fecha-fecha").type(enDias(60));
    cy.get("#campo-fecha-hora").type("18:00");
    cy.contains("button", "Listo").click();
    cy.get("#campo-lugar").type(LUGAR);
    cy.get("#campo-motivo").type(MOTIVO);
    cy.contains("button", "Revisar la convocatoria").click();

    cy.get("h1").should("have.text", "¿Desea publicar la convocatoria?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "Asamblea ordinaria").should("exist");
    cy.contains("dd", LUGAR).should("exist");
    cy.revisarAccesibilidad("convocatoria-confirmar-360");
    cy.contains("button", "Sí, publicar la convocatoria").click();

    cy.contains('[role="status"]', "Convocatoria publicada").should("exist");
    cy.get("h1").should("have.text", "Afiche para pegar en el barrio");
    cy.contains("Asamblea ordinaria").should("exist");
    cy.contains(MOTIVO).should("exist");
    cy.contains("a", "Descargar en PDF")
      .should("have.attr", "href")
      .and("match", /\/api\/asambleas\/.+\/afiche/);
    cy.revisarAccesibilidad("convocatoria-publicada-360");
  });

  it("@HU-ASA-01 CA1 en modo Senior el vecino ve la asamblea convocada y su quórum", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(61),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/asambleas");
    cy.get("h1").should("have.text", "Asambleas");
    cy.contains("h2", "Asamblea ordinaria").should("exist");
    cy.contains(MOTIVO).should("exist");
    cy.contains("¿Cuántos van?").should("exist");
    cy.contains("casas").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-senior-360");
  });

  it("@HU-ASA-02 CA1 CA3 el vecino confirma su asistencia y puede cambiar la respuesta", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(62),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);

    cy.visit("/asambleas");
    cy.esperarHidratacion("Sí, asistiré").click();
    cy.contains("Usted confirmó que asistirá").should("exist");
    cy.contains("1 de").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-confirmado-360");

    cy.contains("button", "Cambiar mi respuesta: ya no podré ir").click();
    cy.contains("button", "Sí, asistiré").should("exist");
  });

  it("@HU-ASA-06 CA1 CA2 el vecino delega su voto en dos pasos, descarga la constancia y puede anularla", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(65),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);

    cy.visit("/asambleas");
    cy.contains("a", "¿No podrá ir? Delegar mi voto").click();
    cy.get("h1").should("have.text", "Delegar mi voto");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("delegar-paso1-360");

    cy.esperarHidratacion("Revisar la delegación").click();
    cy.contains("Escriba el nombre de quien votará por usted.").should("exist");
    cy.contains("El DNI tiene 8 cifras.").should("exist");
    cy.contains("Elija quién es para usted.").should("exist");
    cy.revisarAccesibilidad("delegar-errores-360");

    cy.get("#campo-nombre").type("Rosa Huamán");
    cy.get("#campo-dni").type("08123456");
    cy.contains("button", "Elegir una opción").click();
    cy.contains("button", "Familiar").click();
    cy.contains("button", "Revisar la delegación").click();

    cy.get("h1").should("contain.text", "¿Desea dejarle su voto a Rosa Huamán?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "DNI terminado en 56").should("exist");
    cy.revisarAccesibilidad("delegar-paso2-360");
    cy.contains("button", "Sí, delegar mi voto").click();

    cy.contains('[role="status"]', "Rosa Huamán votará por usted").should("exist");
    cy.contains("h1", /Constancia de delegación N\.° D-\d{4,}/).should("exist");
    cy.revisarAccesibilidad("delegar-registrada-360");
    cy.contains("a", "Descargar constancia (PDF)")
      .should("have.attr", "href")
      .then((href) => {
        cy.request({ url: String(href), encoding: "binary" }).then((r) => {
          expect(r.status).to.eq(200);
          expect(r.headers["content-type"]).to.eq("application/pdf");
          expect(String(r.body).startsWith("%PDF")).to.eq(true);
        });
      });

    cy.visit("/asambleas");
    cy.contains("Delegado a Rosa Huamán").should("exist");
    cy.visit("/asambleas/delegar");
    cy.contains("button", "Anular la delegación").click();
    cy.get("h1").should("have.text", "Delegar mi voto");
  });

  it("@HU-ASA-04 CA2 la directiva ve el quórum proyectado con la barra y si alcanza el mínimo", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(64),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/directiva/asambleas");
    cy.contains("h3", "Quórum proyectado").should("exist");
    cy.get('[role="img"][aria-label^="Barra de quórum"]').should("exist");
    cy.contains(/Falta(n)? \d+ casas? para el mínimo/).should("exist");
    cy.contains("Todavía no alcanza el quórum").should("exist");
    cy.contains("Confirmaron en la app").should("exist");
    cy.revisarAccesibilidad("quorum-directiva-senior-360");
  });

  it("@HU-ASA-03 CA1 CA2 CA3 el mediador busca a un vecino y asienta su asistencia", () => {
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(63),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000003", clave: "clave-de-prueba" });
    cy.viewport(360, 800);

    cy.visit("/directiva/asambleas/asistencia");
    cy.get("h1").should("have.text", "Registrar la asistencia de un vecino");
    cy.get("#campo-buscar").type("Carmen");
    cy.contains("button", "Buscar").click();
    cy.contains("li", "terminado en 78").should("exist");
    cy.revisarAccesibilidad("asistencia-mediador-buscar-360");

    cy.contains("button", "Registrar que asistirá").click();
    cy.contains("Asistirá · gestionado en persona").should("exist");
    cy.revisarAccesibilidad("asistencia-mediador-registrada-360");

    cy.contains("button", "Anular este registro").click();
    cy.contains("Todavía no confirma").should("exist");
  });

  // Las dos últimas vencen el plazo para confirmar de las asambleas vigentes: van al final.
  it("@HU-ASA-05 CA1 CA2 la directiva reprograma una asamblea sin quórum, en dos pasos y en teléfono", () => {
    cy.task("vencerCorteDeAsambleas");
    cy.viewport(360, 800);

    cy.visit("/directiva/asambleas");
    cy.contains("No se llegó al quórum").should("exist");
    cy.revisarAccesibilidad("sin-quorum-directiva-360");
    cy.contains("a", "Decidir qué hacer").click();

    cy.get("h1").should("have.text", "No se llegó al quórum");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("sin-quorum-paso1-360");

    cy.contains("button", "Revisar la decisión").click();
    cy.contains("Indique la nueva fecha y la hora de la asamblea.").should("exist");
    cy.contains("button", "Elegir fecha y hora").click();
    cy.get("#campo-nueva-fecha-fecha").type(enDias(90));
    cy.get("#campo-nueva-fecha-hora").type("18:00");
    cy.contains("button", "Listo").click();
    cy.contains("button", "Revisar la decisión").click();

    cy.get("h1").should("have.text", "¿Desea registrar esta decisión?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "Reprogramar la asamblea").should("exist");
    cy.revisarAccesibilidad("sin-quorum-confirmar-360");
    cy.contains("button", "Sí, registrar la decisión").click();

    cy.contains('[role="status"]', "Decisión registrada").should("exist");
    cy.revisarAccesibilidad("sin-quorum-hecho-360");
  });

  it("@HU-ASA-05 CA3 en modo Senior la directiva convierte la asamblea en sesión informativa y el vecino lo ve", () => {
    cy.task("vencerCorteDeAsambleas");
    cy.viewport(360, 800);
    cy.guardarModo("senior");

    cy.visit("/directiva/asambleas/sin-quorum");
    cy.contains("label", "Convertirla en sesión informativa").click();
    cy.contains("Sin votaciones").should("exist");
    cy.revisarAccesibilidad("sin-quorum-informativa-senior-360");
    cy.contains("button", "Revisar la decisión").click();

    cy.contains("dd", "Sesión informativa").should("exist");
    cy.contains("button", "Sí, registrar la decisión").click();
    cy.contains('[role="status"]', "Decisión registrada").should("exist");

    cy.visit("/asambleas");
    cy.contains("Será una sesión informativa").should("exist");
    cy.contains("no se votará ni se tomarán acuerdos").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-informativa-senior-360");
  });

  // Reinicia las asambleas y las deja en curso con un padrón de 3 casas (mínimo: 2): va al final.
  it("@HU-ASA-07 CA1 CA2 CA3 el mediador hace el pase de lista, valida un poder y abre las votaciones con quórum", () => {
    cy.task("reiniciarAsambleas");
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(70),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    }).then(({ body }) => {
      // Marta (directiva y vecina) le deja su voto a una apoderada: el poder se valida en la puerta.
      cy.request("POST", `/api/asambleas/${body.id}/delegaciones`, {
        nombre: "Rosa Huamán",
        dni: "08123456",
        condicion: "FAMILIAR",
      })
        .its("status")
        .should("eq", 201);
    });
    cy.task("empezarAsambleas", { padronTotal: 3, quorumRequerido: 2 });
    cy.viewport(360, 800);

    cy.visit("/directiva/asambleas/pase-de-lista");
    cy.get("h1").should("have.text", "Pase de lista");
    cy.contains("0 de 3 casas").should("exist");
    cy.contains("Votaciones bloqueadas").should("exist");
    cy.revisarAccesibilidad("pase-de-lista-360");

    // Sin quórum definitivo, abrir las votaciones se rechaza y dice cuánto falta.
    cy.esperarHidratacion("Abrir las votaciones").click();
    cy.contains("faltan 2 casas para el quórum de 2").should("exist");

    cy.get("#campo-buscar").type("Carmen");
    cy.contains("button", "Buscar").click();
    cy.contains("button", "Marcar presente").click();
    cy.contains("Presente").should("exist");
    cy.contains("Presentes: 1 · Poderes validados: 0").should("exist");

    // El poder de Marta se valida en su pantalla y suma su casa al quórum definitivo.
    cy.contains("a", "Poderes (delegaciones de voto)").click();
    cy.get("h1").should("have.text", "Poderes (delegaciones de voto)");
    cy.contains("Rosa Huamán representa a Marta").should("exist");
    cy.revisarAccesibilidad("poderes-360");
    cy.contains("button", "Validar el poder").click();
    cy.contains("Validado").should("exist");

    cy.visit("/directiva/asambleas/pase-de-lista");
    cy.contains("Presentes: 1 · Poderes validados: 1").should("exist");
    cy.contains("2 de 3 casas").should("exist");
    cy.contains("Hay quórum").should("exist");
    cy.revisarAccesibilidad("pase-de-lista-con-quorum-360");
    cy.contains("button", "Abrir las votaciones").click();
    cy.contains("Votaciones abiertas").should("exist");

    // El vecino ve que se vota en el local, no en la app (no hay voto digital).
    cy.guardarModo("senior");
    cy.visit("/asambleas");
    cy.contains("Votación abierta ahora").should("exist");
    cy.revisarAccesibilidad("asambleas-vecino-votacion-senior-360");
  });
});
