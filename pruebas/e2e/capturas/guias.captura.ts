export {};

// Capturas de los tutoriales por sección (VAM-08): abre cada pantalla con datos de prueba ficticios, en un teléfono, encierra
// en un círculo lo que la persona tiene que tocar, le pone una flecha y guarda la imagen. No es una prueba ni corre en el CI:
// se corre a mano cuando cambia una pantalla de las guías, y las imágenes se copian a public/guias/.
//   npx cypress run --spec pruebas/e2e/capturas/guias.captura.ts --config specPattern=pruebas/e2e/capturas/*.captura.ts
// Las imágenes quedan en pruebas/e2e/screenshots/guias.captura.ts/.
// El mismo orden y los mismos textos que modulos/accesibilidad/dominio/recorridos.ts.

const ROJO = "#C0261C";

const PASOS: { archivo: string; ruta: string; texto: string }[] = [
  { archivo: "cuota-1", ruta: "/cuota", texto: "Lo que debe hoy" },
  { archivo: "cuota-2", ruta: "/cuota", texto: "Pagar mi cuota" },
  { archivo: "cuota-3", ruta: "/cuota", texto: "Mis pagos y recibos" },
  { archivo: "cuota-4", ruta: "/cuota", texto: "Cómo se calcula su cuota semanal" },
  { archivo: "cuota-5", ruta: "/cuota", texto: "Hacer un reclamo" },
  { archivo: "asambleas-1", ruta: "/asambleas", texto: "Sí, asistiré" },
  { archivo: "asambleas-2", ruta: "/asambleas", texto: "¿Cuántos van?" },
  { archivo: "asambleas-3", ruta: "/asambleas", texto: "Delegar mi voto" },
  { archivo: "asambleas-4", ruta: "/asambleas", texto: "Proponer un tema para la agenda" },
  { archivo: "incidentes-1", ruta: "/incidentes", texto: "Reportar un problema" },
  { archivo: "incidentes-2", ruta: "/incidentes/reportar", texto: "Enviar sin mi nombre" },
  { archivo: "incidentes-3", ruta: "/incidentes", texto: "Mis reportes" },
  { archivo: "incidentes-4", ruta: "/incidentes", texto: "Lista · " },
];

/** Encierra el elemento en un círculo rojo con borde blanco y le apunta una flecha desde abajo a la izquierda. */
function marcar(elemento: HTMLElement) {
  const doc = elemento.ownerDocument;
  doc.querySelectorAll("[data-marca-guia]").forEach((n) => n.remove());
  const r = elemento.getBoundingClientRect();
  const margen = 10;
  const circulo = doc.createElement("div");
  circulo.setAttribute("data-marca-guia", "");
  Object.assign(circulo.style, {
    position: "fixed",
    left: `${r.left - margen}px`,
    top: `${r.top - margen}px`,
    width: `${r.width + margen * 2}px`,
    height: `${r.height + margen * 2}px`,
    border: `5px solid ${ROJO}`,
    borderRadius: "999px",
    boxShadow: "0 0 0 3px #FFFFFF, inset 0 0 0 3px #FFFFFF",
    zIndex: "2147483647",
    pointerEvents: "none",
  });
  const largo = 70;
  const x = Math.max(8, r.left + Math.min(40, r.width / 2) - largo);
  const y = r.bottom + margen + 4;
  const flecha = doc.createElement("div");
  flecha.setAttribute("data-marca-guia", "");
  flecha.innerHTML = `<svg width="${largo + 10}" height="${largo + 10}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 72 L60 20" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round"/>
    <path d="M42 14 L66 14 L66 38" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 72 L60 20" stroke="${ROJO}" stroke-width="7" stroke-linecap="round"/>
    <path d="M42 14 L66 14 L66 38" fill="none" stroke="${ROJO}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  Object.assign(flecha.style, {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
    zIndex: "2147483647",
    pointerEvents: "none",
  });
  doc.body.append(circulo, flecha);
}

describe("Capturas de las guías por sección", () => {
  before(() => {
    cy.task("reiniciarAsambleas");
    // La directiva publica una asamblea, para que haya qué confirmar, delegar y proponer.
    cy.clearCookies();
    cy.request("POST", "/api/auth/clave", { dni: "40000002", clave: "clave-de-prueba" });
    cy.request("POST", "/api/auth/politica", { acepto: true });
    const fecha = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
    cy.request("POST", "/api/asambleas", {
      tipoAsamblea: "ORDINARIA",
      fecha,
      hora: "18:00",
      lugar: "Local comunal del Parque Central",
      motivo: "Aprobar el presupuesto para cámaras de seguridad en las entradas del barrio.",
      idOperacion: crypto.randomUUID(),
    });
  });

  it("toma una captura por paso", () => {
    cy.entrarComoVecinaNueva("Rosa Medina Torres").then(({ dni }) => {
      cy.task("emitirCuotas", {
        dni,
        cuotas: ["2026-10-26", "2026-11-02"].map((periodo) => ({
          periodo,
          estado: "PENDIENTE",
          lineas: [{ clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250, cantidad: 1 }],
        })),
      });
    });
    // Sin la oferta de la guía arriba: la captura muestra la pantalla como queda después.
    for (const seccion of ["CUOTA", "ASAMBLEAS", "INCIDENTES"]) {
      cy.request("POST", "/api/accesibilidad/onboarding", { seccion, accion: "omitir" });
    }
    cy.guardarModo("normal");
    cy.viewport(390, 760);
    for (const paso of PASOS) {
      cy.visit(paso.ruta);
      cy.get("h1").should("exist");
      cy.contains(
        "main a, main button, main h2, main h3, main strong, main summary, main label, main span",
        paso.texto,
      )
        .first()
        .scrollIntoView({ offset: { top: -220, left: 0 } })
        .then(($el) => marcar($el[0]));
      cy.screenshot(paso.archivo, { capture: "viewport", overwrite: true });
    }
  });
});
