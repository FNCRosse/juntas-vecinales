"use client";
// @HU-ACC-04

import { Phone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clasesBotonBarra } from "./Boton";

/** "Pedir ayuda" en la barra superior: lleva la pantalla donde está, para que no tenga que explicarla. */
export function EnlaceAyuda({ ruta }: { ruta: string }) {
  const actual = usePathname();
  const href = actual && actual !== ruta ? `${ruta}?desde=${encodeURIComponent(actual)}` : ruta;
  return (
    <Link href={href} className={clasesBotonBarra()}>
      <Phone aria-hidden className="size-icono shrink-0" />
      <span>Pedir ayuda</span>
    </Link>
  );
}
