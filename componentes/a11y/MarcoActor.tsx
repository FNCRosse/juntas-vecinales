// @HU-ACC-06
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

// Solo en el escritorio (lg): el contenido de cada pantalla se reparte en dos columnas. Los títulos, el "Volver",
// los avisos y los formularios ocupan las dos; las tarjetas y listas, una cada una. En teléfono y tablet no cambia.
const DOS_COLUMNAS = [
  "lg:max-w-300",
  "lg:[&>div]:grid lg:[&>div]:grid-cols-2 lg:[&>div]:items-start",
  "lg:[&>div>:is(h1,p,form,ul,[role=status],[role=alert],a.self-start)]:col-span-2",
  "lg:[&>div>:has(h1)]:col-span-2",
  // Lo que debe ir a todo el ancho (un gráfico, una tabla): se marca con data-ancho="completo".
  "lg:[&>div>[data-ancho=completo]]:col-span-2",
].join(" ");

export function MarcoActor({
  actor,
  modoSenior,
  conteos,
  selector,
  children,
}: {
  /** Selector de vista del encabezado (ver Encabezado). */
  selector?: ReactNode;
  /** Sin actor: pantallas de acceso, sin sesión, sin navegación ni "Pedir ayuda". */
  actor?: Actor;
  modoSenior: boolean;
  /** Lo que espera en cada destino de la barra, por su href (la directiva ve cuántos cobros e incidentes). */
  conteos?: Record<string, number>;
  children: ReactNode;
}) {
  return (
    <>
      <Encabezado modoSenior={modoSenior} rutaAyuda={actor && RUTA_AYUDA[actor]} selector={selector} />
      <div className="lg:flex">
        {actor && <BarraNavegacion actor={actor} conteos={conteos} />}
        <main
          id="contenido"
          tabIndex={-1}
          className={`mx-auto w-full max-w-180 px-4 py-6 ${actor ? `pb-28 md:pb-6 ${DOS_COLUMNAS}` : ""}`}
        >
          {children}
        </main>
      </div>
      <AnunciadorRuta />
    </>
  );
}
