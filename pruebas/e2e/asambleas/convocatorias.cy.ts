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

  it("@HU-ASA-13 CA1 CA2 el vecino propone un tema en teléfono y la directiva lo ve pendiente de revisión", () => {
    const tema = `Cámaras en la entrada ${sufijo}`;
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(66),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);

    cy.visit("/asambleas");
    cy.contains("a", "Proponer un tema para la agenda").click();
    cy.get("h1").should("have.text", "Proponer un tema");
    cy.revisarAccesibilidad("proponer-tema-360");

    cy.esperarHidratacion("Enviar mi propuesta").click();
    cy.contains("Escriba el tema que quiere proponer.").should("exist");
    cy.contains("Cuéntenos por qué es importante, en unas pocas líneas.").should("exist");
    cy.revisarAccesibilidad("proponer-tema-errores-360");

    cy.get("#campo-titulo").type(tema);
    cy.get("#campo-justificacion").type("Hubo dos robos este mes.");
    cy.contains("button", "Enviar mi propuesta").click();
    cy.contains('[role="status"]', "Recibimos su propuesta").should("exist");
    cy.contains("Quedó pendiente de revisión.").should("exist");
    cy.revisarAccesibilidad("proponer-tema-enviada-360");

    // Marta es también de la directiva: ve su propia propuesta en la bandeja, pendiente de revisión.
    cy.visit("/directiva/asambleas/propuestas");
    cy.get("h1").should("have.text", "Propuestas para la agenda");
    cy.contains("article", tema).should("contain.text", "Por revisar");
    cy.revisarAccesibilidad("propuestas-directiva-360");
  });

  it("@HU-ASA-14 CA2 CA3 la directiva incluye una propuesta en la agenda, la descarta con motivo y el vecino recibe el aviso", () => {
    const tema = `Botiquín para el local ${sufijo}`;
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha: enDias(67),
      hora: "18:00",
      lugar: LUGAR,
      motivo: MOTIVO,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.request("GET", "/api/asambleas")
      .its("body")
      .then((asambleas: { id: string }[]) => {
        cy.request("POST", `/api/asambleas/${asambleas[0].id}/propuestas`, {
          titulo: tema,
          justificacion: "Para emergencias durante las asambleas.",
          idOperacion: crypto.randomUUID(),
        })
          .its("status")
          .should("eq", 201);
      });
    cy.viewport(360, 800);

    cy.visit("/directiva/asambleas/propuestas");
    cy.contains("article", tema).should("contain.text", "Por revisar");
    cy.revisarAccesibilidad("propuestas-decidir-360");
    cy.contains("article", tema).contains("button", "Decidir").click();
    cy.contains("button", "Incluir en la agenda").click();
    cy.contains("article", tema).should("contain.text", "Incluida en la agenda");
    cy.contains("ol li", tema).should("contain.text", "Propuesta vecinal de Marta");
    cy.revisarAccesibilidad("propuestas-incluida-360");

    // El vecino ve el tema entre los «Temas a tratar», sin el nombre de quien lo propuso.
    cy.visit("/asambleas");
    cy.contains("ol li", tema).should("contain.text", "Propuesta de un vecino");

    // Se puede cambiar la decisión; ahora se descarta con un motivo breve.
    cy.visit("/directiva/asambleas/propuestas");
    cy.contains("article", tema).contains("button", "Cambiar la decisión").click();
    cy.contains("article", tema).should("contain.text", "Por revisar");
    cy.contains("article", tema).contains("button", "Decidir").click();
    cy.contains("button", "No incluir").click();
    cy.contains("Motivo breve (se lo enviaremos al vecino)").should("exist");
    cy.contains("button", "Ya se trató en otra asamblea").click();
    cy.contains("article", tema).should("contain.text", "No incluida: Ya se trató en otra asamblea");

    // El worker no corre en la prueba: se escribe la copia interna de los avisos pendientes.
    cy.task("copiaInternaDeLaCola", { dni: "40000002" });
    cy.visit("/avisos");
    cy.contains("Su propuesta no se incluyó en la agenda").should("exist");
  });

  it("@HU-ASA-08 CA1 CA2 la directiva publica una actividad pro fondos y la vecina elige su aporte y adjunta el comprobante", () => {
    const nombre = `Pollada para la reja ${sufijo}`;
    cy.viewport(360, 800);

    // La directiva publica la actividad en dos pasos.
    cy.visit("/directiva/crear");
    cy.contains("a", "Nueva actividad pro-fondos").click();
    cy.get("h1").should("have.text", "Nueva actividad pro-fondos");
    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.revisarAccesibilidad("actividad-nueva-360");

    cy.esperarHidratacion("Revisar la actividad").click();
    cy.contains("Elija qué actividad es.").should("exist");
    cy.contains("Elija cómo pueden pagar los vecinos.").should("exist");
    cy.contains("Escriba el nombre de la actividad.").should("exist");
    cy.revisarAccesibilidad("actividad-errores-360");

    cy.contains("button", "Elegir una opción").click();
    cy.contains("button", "Pollada").click();
    cy.contains("button", "Escribir los datos").click();
    cy.get("#campo-nombre").type(nombre);
    cy.get("#campo-paraQue").type("Reparar la reja principal");
    cy.get("#campo-fecha").type(enDias(40));
    cy.get("#campo-hora").type("12:00");
    cy.get("#campo-lugar").type("Parque Central");
    cy.get("#campo-precio").type("15");
    cy.get("#campo-meta").type("1200");
    cy.contains("button", "Listo").click();
    cy.contains("button", "Elegir una opción").click();
    cy.contains("button", "Por Yape o Plin y en la puerta").click();
    cy.contains("button", "Revisar la actividad").click();

    cy.get("h1").should("have.text", "¿Desea publicar la actividad?");
    cy.focused().should("match", "h1");
    cy.contains("dd", nombre).should("exist");
    cy.contains("dd", "S/ 15").should("exist");
    cy.revisarAccesibilidad("actividad-confirmar-360");
    cy.contains("button", "Sí, publicar la actividad").click();
    cy.contains('[role="status"]', "Actividad publicada").should("exist");
    cy.revisarAccesibilidad("actividad-publicada-360");

    // La vecina la ve, elige cuántos platos y cómo, y confirma.
    cy.visit("/actividades");
    cy.get("h1").should("have.text", "Actividades pro-fondos");
    cy.contains("h2", nombre).should("exist");
    cy.contains("Colaboración: S/ 15.00 por plato.").should("exist");
    cy.revisarAccesibilidad("actividades-vecino-360");
    cy.contains("a", "Colaborar con la actividad").click();

    cy.contains("p", "Paso 1 de 2").should("exist");
    cy.contains("button", "Elegir una opción").click();
    cy.contains("button", "Pagar antes con Yape o Plin").click();
    cy.contains("button", "Uno más").click();
    cy.contains("button", "Uno más").click();
    cy.contains("Total: S/ 45.00").should("exist");
    cy.revisarAccesibilidad("colaborar-paso1-360");
    cy.contains("button", "Revisar mi aporte").click();

    cy.get("h1").should("have.text", "¿Desea confirmar su aporte?");
    cy.focused().should("match", "h1");
    cy.contains("dd", "S/ 45.00").should("exist");
    cy.contains("dd", "Pago antes con Yape o Plin").should("exist");
    cy.revisarAccesibilidad("colaborar-confirmar-360");
    cy.contains("button", "Sí, confirmar mi aporte").click();

    cy.location("pathname").should("eq", "/actividades");
    cy.contains("Usted ya registró su aporte").should("exist");
    cy.contains("3 platos · S/ 45.00").should("exist");
    cy.contains("label", "Foto del comprobante de Yape o Plin").should("exist");
    cy.revisarAccesibilidad("actividades-aporte-360");

    // El CI no habla con R2: el comprobante se simula con un archivo ya registrado y se adjunta por la API.
    cy.request("GET", "/api/eventos")
      .its("body")
      .then((actividades: { id: string; nombre: string }[]) => {
        const actividad = actividades.find((a) => a.nombre === nombre)!;
        cy.task("archivoDePrueba", { dni: "40000002", uso: "comprobante_aporte" }).then((archivoId) => {
          cy.request("POST", `/api/eventos/${actividad.id}/colaboraciones/comprobante`, { archivoId })
            .its("status")
            .should("eq", 200);
        });
      });
    cy.visit("/actividades");
    cy.contains("Recibimos su comprobante").should("exist");
  });

  it("@HU-ASA-09 CA1 CA2 CA3 la vecina ofrece su ayuda, la directiva la aprueba con un rol y deja de pagar", () => {
    const nombre = `Bingo con voluntarios ${sufijo}`;
    // Más cercana que la actividad anterior (+40 días), así es la próxima.
    cy.request("POST", "/api/eventos", {
      tipoActividad: "BINGO",
      nombre,
      paraQue: "Comprar sillas para el local comunal",
      fecha: enDias(20),
      hora: "17:00",
      lugar: "Local comunal",
      precio: "10",
      meta: "",
      pagos: "AMBOS",
      pideVoluntarios: true,
      idOperacion: crypto.randomUUID(),
    })
      .its("status")
      .should("eq", 201);
    cy.viewport(360, 800);

    // La vecina elige «voluntaria» y cuenta cómo ayudaría.
    cy.visit("/actividades");
    cy.contains("h2", nombre).should("exist");
    cy.contains("a", "Colaborar con la actividad").click();
    cy.contains("button", "Elegir una opción").click();
    cy.contains("button", "Prefiero ayudar como voluntaria").click();
    cy.contains("label", "¿Cómo le gustaría ayudar?").should("exist");
    cy.revisarAccesibilidad("voluntario-paso1-360");
    cy.contains("button", "Revisar mi aporte").click();
    cy.contains("Cuéntenos cómo le gustaría ayudar.").should("exist");
    cy.get("#campo-descripcion").type("Puedo atender la mesa de la entrada.");
    cy.contains("button", "Revisar mi aporte").click();

    cy.get("h1").should("have.text", "¿Desea confirmar su aporte?");
    cy.contains("dd", "Ayuda como voluntaria (sin pago)").should("exist");
    cy.revisarAccesibilidad("voluntario-confirmar-360");
    cy.contains("button", "Sí, confirmar mi aporte").click();
    cy.location("pathname").should("eq", "/actividades");
    cy.contains("Usted ofreció su ayuda").should("exist");
    cy.revisarAccesibilidad("voluntario-ofrecida-360");

    // La directiva la aprueba registrando el rol.
    cy.visit("/directiva/actividades");
    cy.get("h1").should("have.text", nombre);
    cy.contains("article", "Puedo atender la mesa de la entrada.").should("contain.text", "Por aprobar");
    cy.revisarAccesibilidad("voluntarios-directiva-360");
    cy.contains("article", "Puedo atender la mesa").contains("button", "Aprobar la ayuda").click();
    cy.get("[role=dialog]").contains("button", "Aprobar la ayuda").click();
    cy.get("[role=dialog]").should("contain.text", "Escriba el rol que tendrá");
    cy.get("#campo-rol").type("Mesa de la entrada");
    cy.get("[role=dialog]").contains("button", "Aprobar la ayuda").click();
    cy.contains("article", "Puedo atender la mesa").should(
      "contain.text",
      "Ayuda aprobada: Mesa de la entrada",
    );

    // Aprobada, la casa no paga: la página lo dice y el servidor rechaza un aporte.
    cy.visit("/actividades");
    cy.contains("Ayuda aprobada").should("exist");
    cy.contains("no paga la colaboración").should("exist");
    cy.revisarAccesibilidad("voluntario-aprobada-360");
    cy.request("GET", "/api/eventos")
      .its("body")
      .then((actividades: { id: string; nombre: string }[]) => {
        const actividad = actividades.find((a) => a.nombre === nombre)!;
        cy.request({
          method: "POST",
          url: `/api/eventos/${actividad.id}/colaboraciones`,
          body: { cantidad: 1, modalidad: "EN_PUERTA", idOperacion: crypto.randomUUID() },
          failOnStatusCode: false,
        })
          .its("status")
          .should("be.gte", 400);
      });

    // El worker no corre en la prueba: se escribe la copia interna del aviso de aprobación.
    cy.task("copiaInternaDeLaCola", { dni: "40000002" });
    cy.visit("/avisos");
    cy.contains("Su ayuda fue aprobada").should("exist");
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

  it("@HU-GAR-19 CA1 CA3 el inicio muestra la próxima asamblea y se actualiza cuando la vecina confirma", () => {
    cy.viewport(360, 800);
    cy.visit("/");
    cy.contains("a", "Próxima asamblea").should("contain.text", "Falta confirmar su asistencia");
    cy.revisarAccesibilidad("inicio-asamblea-sin-confirmar-360");

    cy.visit("/asambleas");
    cy.esperarHidratacion("Sí, asistiré").click();
    cy.contains("Usted confirmó que asistirá").should("exist");

    cy.visit("/");
    cy.contains("a", "Próxima asamblea").should("contain.text", "Usted asistirá");
    cy.revisarAccesibilidad("inicio-asamblea-confirmada-360");

    // Se deja como estaba para los demás casos.
    cy.visit("/asambleas");
    cy.contains("button", "Cambiar mi respuesta: ya no podré ir").click();
    cy.contains("button", "Sí, asistiré").should("exist");
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
