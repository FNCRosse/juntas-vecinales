"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Vuelve a pedir los datos de la pantalla cada tantos segundos, sin mover el foco ni lo escrito. */
export function RefrescarSolo({ segundos }: { segundos: number }) {
  const router = useRouter();
  useEffect(() => {
    const intervalo = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(intervalo);
  }, [router, segundos]);
  return null;
}
