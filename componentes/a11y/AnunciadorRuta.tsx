"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Al cambiar de ruta en el cliente, el foco va al <h1> y una región aria-live anuncia el título
// de la pantalla nueva (FRONTEND.md §2). En la primera carga no se mueve el foco.

export function AnunciadorRuta() {
  const ruta = usePathname();
  const anterior = useRef(ruta);
  const region = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (anterior.current === ruta) return;
    anterior.current = ruta;
    const titulo = document.querySelector<HTMLElement>("main h1");
    if (!titulo || !region.current) return;
    titulo.tabIndex = -1;
    titulo.focus();
    region.current.textContent = titulo.textContent ?? "";
  }, [ruta]);

  return <p ref={region} aria-live="polite" className="sr-only" />;
}
