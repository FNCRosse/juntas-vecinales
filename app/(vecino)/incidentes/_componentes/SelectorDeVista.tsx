"use client";
// @HU-QUE-08 @HU-ACC-07

import { useRouter } from "next/navigation";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";

// "Ver los incidentes como": un solo objetivo con la vista elegida y "Cambiar"; las tres vistas se eligen en
// una hoja (prototipo VEC-QUE-01 a 03, R-11). La vista vive en la URL para que se pueda volver atrás.
export function SelectorDeVista({
  vista,
  opciones,
}: {
  vista: string;
  opciones: { valor: string; etiqueta: string }[];
}) {
  const router = useRouter();
  return (
    <SelectorEnHoja
      id="vista-incidentes"
      pregunta="Ver los incidentes como"
      opciones={opciones}
      valor={vista}
      alElegir={(valor) => router.push(`/incidentes?vista=${valor}`, { scroll: false })}
    />
  );
}
