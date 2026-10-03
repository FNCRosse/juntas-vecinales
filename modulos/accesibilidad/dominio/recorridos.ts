// @HU-ACC-10
// Los recorridos guiados por sección: cada paso explica una sola acción y la nombra tal como se ve en la
// pantalla (CA1). M4 y M5 agregan Asambleas y Mi cuota.

export type PasoGuia = { titulo: string; texto: string; accion: string };

export const RECORRIDOS = {
  INCIDENTES: {
    nombre: "Incidentes",
    href: "/incidentes",
    pasos: [
      {
        titulo: "Avise de un problema del barrio",
        texto: "Elija el tipo, cuente qué pasó, diga dónde fue y agregue una foto o un video.",
        accion: "Reportar un problema",
      },
      {
        titulo: "Puede enviarlo sin su nombre",
        texto: "Nadie verá quién lo envió. Le daremos un código para que siga su reporte.",
        accion: "Enviar sin mi nombre (modo anónimo)",
      },
      {
        titulo: "Vea cómo avanza su reporte",
        texto: "En Mis reportes, toque el suyo para ver en qué paso va. Le avisaremos cada vez que cambie.",
        accion: "Mis reportes",
      },
      {
        titulo: "Vea lo que pasa en el barrio",
        texto: "Elija Lista, Mapa o Resumen. Todo se muestra por manzana, sin la casa de nadie.",
        accion: "Mapa",
      },
    ],
  },
} as const satisfies Record<string, { nombre: string; href: string; pasos: readonly PasoGuia[] }>;

export type Seccion = keyof typeof RECORRIDOS;
