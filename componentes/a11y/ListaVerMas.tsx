"use client";
// @HU-ACC-09

import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useState } from "react";
import { clasesBoton } from "./Boton";

// Lista corta con "Ver más" (prototipo, R-11): 5 elementos en vista normal y 3 en vista grande, y el
// resto se despliega en el mismo lugar. Los que sobran se ocultan con CSS según el modo, así el
// servidor entrega la lista completa y no hay parpadeo al cambiar de vista. "Ver menos" vuelve a
// plegar y deja el foco en el mismo botón.

export function ListaVerMas({
  etiqueta,
  elementos,
  normal = 5,
  senior = 3,
}: {
  /** Nombre de la lista para el lector de pantalla ("Avisos"). */
  etiqueta: string;
  elementos: ReactNode[];
  normal?: number;
  senior?: number;
}) {
  const [abierta, setAbierta] = useState(false);
  const total = elementos.length;
  if (!total) return null;
  const sobranNormal = Math.max(0, total - normal);
  const sobranSenior = Math.max(0, total - senior);
  const claseBoton = sobranNormal ? "" : sobranSenior ? "hidden senior:inline-flex" : "hidden";
  return (
    <>
      <ul className="flex flex-col gap-separacion" aria-label={etiqueta}>
        {elementos.map((el, i) => (
          <li key={i} className={abierta ? "" : i >= normal ? "hidden" : i >= senior ? "senior:hidden" : ""}>
            {el}
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-expanded={abierta}
        onClick={() => setAbierta(!abierta)}
        className={`${clasesBoton("secundario", true)} ${claseBoton}`}
      >
        {abierta ? (
          <ChevronUp aria-hidden className="size-icono shrink-0" />
        ) : (
          <ChevronDown aria-hidden className="size-icono shrink-0" />
        )}
        {abierta ? (
          <span>Ver menos</span>
        ) : (
          <>
            <span className="senior:hidden">Ver más ({sobranNormal})</span>
            <span className="hidden senior:inline">Ver más ({sobranSenior})</span>
          </>
        )}
      </button>
    </>
  );
}
