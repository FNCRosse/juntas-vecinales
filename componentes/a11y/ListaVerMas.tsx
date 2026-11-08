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
  anchoCompleto,
  columnas,
}: {
  /** Nombre de la lista para el lector de pantalla ("Avisos"). */
  etiqueta: string;
  elementos: ReactNode[];
  normal?: number;
  senior?: number;
  /**
   * En escritorio la lista se reparte en dos columnas y los elementos marcados aquí (por su posición) ocupan las dos. Sin
   * esta lista, una sola columna. En teléfono y tablet siempre una.
   */
  anchoCompleto?: boolean[];
  /** Tarjetas angostas: en escritorio la lista se reparte en 2 o 3 columnas iguales. En teléfono y tablet, una. */
  columnas?: 2 | 3;
}) {
  const [abierta, setAbierta] = useState(false);
  const total = elementos.length;
  if (!total) return null;
  const sobranNormal = Math.max(0, total - normal);
  const sobranSenior = Math.max(0, total - senior);
  // La visibilidad va en un contenedor: en el propio botón, "hidden" pierde contra su "inline-flex".
  const contenedor = sobranNormal ? "flex flex-col" : "hidden senior:flex senior:flex-col";
  return (
    <>
      <ul
        className={`flex flex-col gap-separacion ${columnas === 3 ? "lg:grid lg:grid-cols-3 lg:items-start" : anchoCompleto || columnas === 2 ? "lg:grid lg:grid-cols-2 lg:items-start" : ""}`}
        aria-label={etiqueta}
      >
        {elementos.map((el, i) => (
          <li
            key={i}
            className={`${abierta ? "" : i >= normal ? "hidden" : i >= senior ? "senior:hidden" : ""} ${anchoCompleto?.[i] ? "lg:col-span-2" : ""}`}
          >
            {el}
          </li>
        ))}
      </ul>
      {sobranSenior > 0 && (
        <div className={contenedor}>
          <button
            type="button"
            aria-expanded={abierta}
            onClick={() => setAbierta(!abierta)}
            className={clasesBoton("secundario", true)}
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
        </div>
      )}
    </>
  );
}
