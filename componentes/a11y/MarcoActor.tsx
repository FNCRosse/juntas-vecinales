import type { ReactNode } from "react";
import { AnunciadorRuta } from "./AnunciadorRuta";
import { type Actor, BarraNavegacion } from "./BarraNavegacion";
import { Encabezado } from "./Encabezado";

// Estructura común de los layouts por actor: barra superior, navegación del actor, <main id="contenido">
// (destino de "Saltar al contenido") y el anuncio de cambio de ruta.

const RUTA_AYUDA: Record<Actor, string> = {
  vecino: "/mas/ayuda",
  directiva: "/directiva/ayuda",
  administrador: "/administracion/ayuda",
  garita: "/garita/ayuda",
};

export function MarcoActor({
  actor,
  modoSenior,
  children,
}: {
  /** Sin actor: pantallas de acceso, sin sesión, sin navegación ni "Pedir ayuda". */
  actor?: Actor;
  modoSenior: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Encabezado modoSenior={modoSenior} rutaAyuda={actor && RUTA_AYUDA[actor]} />
      {actor && <BarraNavegacion actor={actor} />}
      <main
        id="contenido"
        tabIndex={-1}
        className={`mx-auto max-w-180 px-4 py-6 ${actor ? "pb-28 md:pb-6" : ""}`}
      >
        {children}
      </main>
      <AnunciadorRuta />
    </>
  );
}
