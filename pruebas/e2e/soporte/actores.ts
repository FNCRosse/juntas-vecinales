// Una ruta puede ser un recorrido: "/ruta > texto de un enlace > texto de otro": se visita la primera y se pulsa
// cada enlace en orden, para medir las pantallas que dependen de un dato (la ficha de una vivienda, por ejemplo).

// Los cuatro actores con sus rutas reales, para las pruebas de densidad (R-11) y de área táctil (R-03):
// la misma lista las recorre con las semillas, así una pantalla nueva solo se agrega aquí.

export type Actor = { nombre: string; dni: string; politica: boolean; rutas: string[] };

export const ACTORES: Actor[] = [
  {
    nombre: "vecino",
    dni: "40000002",
    politica: true,
    rutas: [
      "/mas",
      "/avisos",
      "/",
      "/mas/ayuda-y-accesibilidad",
      "/mas/perfil",
      "/visitas",
      "/transparencia",
      "/incidentes",
      "/guia",
      "/avisos/preferencias",
      "/mas/perfil/corregir",
      "/mas/perfil/cancelar",
      "/visitas/nueva",
      "/mas/ayuda",
      "/noticias",
      "/incidentes/reportar",
    ],
  },
  {
    nombre: "directiva",
    dni: "40000003",
    politica: false,
    rutas: [
      "/directiva",
      "/directiva/incidentes",
      "/directiva/pedidos-de-ayuda",
      "/directiva/alertas",
      "/directiva/mas",
      "/directiva/ayuda",
    ],
  },
  {
    nombre: "administrador",
    dni: "40000001",
    politica: false,
    rutas: [
      "/administracion",
      "/administracion/padron",
      "/administracion/equipo",
      "/administracion/auditoria",
      "/administracion/privacidad",
      "/administracion/mas",
      "/administracion/ayuda",
      "/administracion/padron/empadronar",
      "/administracion/padron > Mz. A, lote 12",
      "/administracion/padron > Mz. A, lote 12 > Actualizar los datos del predio",
      "/administracion/padron > Mz. A, lote 12 > Dar de baja a un residente",
    ],
  },
  {
    nombre: "garita",
    dni: "40000004",
    politica: false,
    rutas: ["/garita", "/garita/consultar", "/garita/visitas", "/garita/bitacora", "/garita/ayuda"],
  },
];

/** Entra como el actor con la clave de las semillas y deja su vista (normal o grande). */
export function entrarComo(actor: Actor, modo: "normal" | "senior") {
  cy.clearCookies();
  cy.request("POST", "/api/auth/clave", { dni: actor.dni, clave: "clave-de-prueba" });
  if (actor.politica) cy.request("POST", "/api/auth/politica", { acepto: true });
  cy.guardarModo(modo);
}

/** Va a la ruta; si es un recorrido, pulsa cada enlace en orden. */
export function visitarRuta(ruta: string) {
  const [inicio, ...enlaces] = ruta.split(" > ");
  cy.visit(inicio);
  enlaces.forEach((texto) => cy.contains("a", texto).click());
  cy.get("h1").should("exist");
}
