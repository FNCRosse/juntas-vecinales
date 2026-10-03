// @HU-GAR-21
// Quien tiene rol de equipo y también vive en el barrio (es vecino) pasa de un perfil al otro sin salir
// de la cuenta. Un solo perfil no ofrece cambio. Cada perfil es la zona de pantallas de un actor.
import type { NombreRol } from "./sesion";

export type ClavePerfil = "vecino" | "directiva" | "administracion" | "garita";

const PERFILES: {
  clave: ClavePerfil;
  roles: NombreRol[];
  etiqueta: string;
  descripcion: string;
  href: string;
}[] = [
  {
    clave: "vecino",
    roles: ["VECINO", "VECINO_ADULTO_MAYOR"],
    etiqueta: "Mi perfil de vecino",
    descripcion: "Ver la plataforma como la ve un vecino: su inicio, sus avisos y sus visitas.",
    href: "/",
  },
  {
    clave: "directiva",
    roles: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    etiqueta: "Mi perfil de directiva",
    descripcion: "Volver al resumen de la directiva: comunicados, actas y balances.",
    href: "/directiva",
  },
  {
    clave: "administracion",
    roles: ["ADMINISTRADOR"],
    etiqueta: "Mi perfil de administración",
    descripcion: "Volver al padrón, el equipo y la auditoría.",
    href: "/administracion",
  },
  {
    clave: "garita",
    roles: ["VIGILANTE"],
    etiqueta: "Mi perfil de garita",
    descripcion: "Volver a la consulta de placas y la bitácora.",
    href: "/garita",
  },
];

/** Los otros perfiles a los que puede pasar quien tiene estos roles; vacío si solo tiene uno. */
export function perfilesParaCambiar(roles: NombreRol[], actual: ClavePerfil) {
  const suyos = PERFILES.filter((p) => p.roles.some((r) => roles.includes(r)));
  if (suyos.length < 2) return [];
  return suyos
    .filter((p) => p.clave !== actual)
    .map(({ clave, etiqueta, descripcion, href }) => ({ clave, etiqueta, descripcion, href }));
}
