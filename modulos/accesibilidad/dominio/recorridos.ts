// @HU-ACC-10
// Los recorridos guiados por sección: cada paso explica una sola acción y la nombra tal como se ve en la
// pantalla (CA1). M3 dejó Incidentes, M4 agregó Asambleas y M5 agregará Mi cuota.

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
  ASAMBLEAS: {
    nombre: "Asambleas",
    href: "/asambleas",
    pasos: [
      {
        titulo: "Confirme si irá a la asamblea",
        texto: "Es una confirmación por casa. Puede cambiarla hasta el plazo que se indica.",
        accion: "Sí, asistiré",
      },
      {
        titulo: "Vea cuántos van",
        texto:
          "La barra muestra cuántas casas confirmaron y cuántas se necesitan para que la asamblea pueda decidir.",
        accion: "¿Cuántos van?",
      },
      {
        titulo: "Si no puede ir, deje su voto",
        texto: "Elija a una persona de su confianza. Le daremos una constancia para la mesa.",
        accion: "¿No podrá ir? Delegar mi voto",
      },
      {
        titulo: "Proponga un tema",
        texto: "Cuente qué tema le importa. La directiva decide si entra a la agenda y le avisamos.",
        accion: "Proponer un tema para la agenda",
      },
    ],
  },
} as const satisfies Record<string, { nombre: string; href: string; pasos: readonly PasoGuia[] }>;

export type Seccion = keyof typeof RECORRIDOS;
