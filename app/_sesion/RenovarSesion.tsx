"use client";
// @HU-GAR-03

import { useEffect } from "react";

const CLAVE = "sesion-renovada";
const UN_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Renueva la cookie de sesión una vez al día en este dispositivo (HU-GAR-03 CA2). La fecha de la
 * última renovación es solo una comodidad local: si no se puede leer, se renueva igual.
 */
export function RenovarSesion() {
  useEffect(() => {
    let ultima = 0;
    try {
      ultima = Number(localStorage.getItem(CLAVE) ?? 0);
    } catch {}
    if (Date.now() - ultima < UN_DIA_MS) return;
    fetch("/api/auth/sesion", { method: "PUT" })
      .then((respuesta) => {
        if (!respuesta.ok) return;
        try {
          localStorage.setItem(CLAVE, String(Date.now()));
        } catch {}
      })
      .catch(() => {});
  }, []);
  return null;
}
