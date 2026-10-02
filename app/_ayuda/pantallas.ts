// Nombre de la pantalla donde la persona pidió ayuda (HU-ACC-04 CA2), a partir de su ruta. Las
// rutas nuevas se agregan aquí con su pantalla.

const NOMBRES: [RegExp, string][] = [
  [/^\/$/, "Inicio"],
  [/^\/avisos\/preferencias/, "Qué avisos recibo"],
  [/^\/avisos/, "Avisos"],
  [/^\/guia/, "Guía rápida"],
  [/^\/mas\/ayuda-y-accesibilidad/, "Ayuda y accesibilidad"],
  [/^\/mas/, "Más opciones"],
  [/^\/cuota/, "Mi cuota"],
  [/^\/asambleas/, "Asambleas"],
  [/^\/incidentes/, "Incidentes"],
  [/^\/visitas/, "Mis visitas"],
];

export function nombreDePantalla(ruta: string | undefined) {
  if (!ruta) return "Inicio";
  return NOMBRES.find(([patron]) => patron.test(ruta))?.[1] ?? "Otra pantalla de la app";
}
