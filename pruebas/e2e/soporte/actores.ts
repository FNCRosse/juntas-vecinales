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
