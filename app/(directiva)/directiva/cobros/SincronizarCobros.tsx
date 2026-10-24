"use client";
// @HU-COB-11

import { useEffect } from "react";
import { sincronizarCobros } from "./colaLocal";

// Sin pantalla: manda los cobros en efectivo que quedaron guardados en el teléfono al abrir la app y cada vez que vuelve la
// señal (el evento `online`). Background Sync no se usa: no funciona en Safari ni en Firefox (FRONTEND.md §6). También
// registra el service worker, que guarda la pantalla de cobros guardados para abrirla sin internet.
export function SincronizarCobros() {
  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    const enviar = () => void sincronizarCobros().catch(() => undefined);
    if (navigator.onLine) enviar();
    window.addEventListener("online", enviar);
    return () => window.removeEventListener("online", enviar);
  }, []);
  return null;
}
