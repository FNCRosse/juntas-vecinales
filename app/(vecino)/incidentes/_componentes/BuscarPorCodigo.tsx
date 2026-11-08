"use client";
// @HU-QUE-09

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";

// VEC-QUE-09: lo primero de Incidentes, un buscador con el código de la constancia («Tengo un código de seguimiento»). Buscar
// lleva a la pantalla de seguimiento con el resultado; vacío, dice qué falta (WCAG 3.3.1).
export function BuscarPorCodigo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | undefined>();
  return (
    <form
      role="search"
      aria-label="Buscar un reporte con mi código"
      noValidate
      className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!codigo.trim()) return setError("Escriba el código que está en su constancia.");
        router.push(`/seguimiento?codigo=${encodeURIComponent(codigo.trim())}`);
      }}
    >
      <Campo
        name="codigo"
        etiqueta="Tengo un código de seguimiento"
        ayuda="Está en su constancia. Se parece a: Q-2026-00142-K7QM"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={codigo}
        error={error}
        onChange={(e) => {
          setCodigo(e.target.value);
          setError(undefined);
        }}
      />
      <Boton type="submit" icono={Search} anchoCompleto>
        Buscar mi reporte
      </Boton>
    </form>
  );
}
