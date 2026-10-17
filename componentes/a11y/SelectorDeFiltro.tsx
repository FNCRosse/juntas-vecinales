"use client";
// @HU-ACC-09

import { useRouter } from "next/navigation";
import { SelectorEnHoja } from "./SelectorEnHoja";

// Fila de selección cuyo valor vive en la URL (prototipo, C-20): un solo objetivo con lo elegido y "Cambiar";
// las opciones se abren en una hoja y elegir una cambia la dirección, así se puede volver atrás (R-11).
export function SelectorDeFiltro({
  id,
  pregunta,
  opciones,
  valor,
}: {
  id: string;
  pregunta: string;
  opciones: { valor: string; etiqueta: string; href: string }[];
  valor: string;
}) {
  const router = useRouter();
  return (
    <SelectorEnHoja
      id={id}
      pregunta={pregunta}
      opciones={opciones}
      valor={valor}
      alElegir={(elegido) => {
        const destino = opciones.find((o) => o.valor === elegido)?.href;
        if (destino) router.push(destino, { scroll: false });
      }}
    />
  );
}
