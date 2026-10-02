// @HU-GAR-03
import type { MetadataRoute } from "next";
import tokens from "@/componentes/tokens/tokens.json";

// Acceso directo en la pantalla de inicio del teléfono (HU-GAR-03, R-02): se abre con un toque y,
// con la sesión persistente, entra directo al inicio (start_url "/"). Colores de los tokens.
export default function manifest(): MetadataRoute.Manifest {
  const { paleta } = tokens.color;
  return {
    name: "Junta Vecinal de Villa de Fátima",
    short_name: "Junta Vecinal",
    description: "Su cuota, avisos, asambleas y reportes de la junta vecinal.",
    lang: "es-PE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: paleta.arena["50"].$value,
    theme_color: paleta.verde["700"].$value,
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-enmascarable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
