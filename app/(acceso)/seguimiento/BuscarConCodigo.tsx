"use client";
// @HU-QUE-09

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AvanceReporte } from "@/app/_incidentes/AvanceReporte";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import type { AvanceDto } from "@/modulos/incidencias/aplicacion/seguimiento";

// VEC-QUE-09: buscar el reporte con el código de la constancia; sirve sin sesión, para el reporte anónimo
// o el que registró la directiva (HU-QUE-09 CA1, HU-QUE-02 CA3).
export function BuscarConCodigo({ volver }: { volver: { href: string; texto: string } }) {
  const [codigo, setCodigo] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [buscando, setBuscando] = useState<boolean>(false);
  const [avance, setAvance] = useState<AvanceDto | null>(null);
  const resultado = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (avance) resultado.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [avance]);

  async function buscar() {
    if (!codigo.trim()) return setError("Escriba el código que está en su constancia.");
    setBuscando(true);
    const r = await enviarJson<AvanceDto>(
      `/api/quejas/seguimiento/${encodeURIComponent(codigo.trim())}`,
      "GET",
    );
    setBuscando(false);
    setAvance(r.ok ? r.datos : null);
    setError(r.ok ? undefined : r.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={volver.href}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        {volver.texto}
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Buscar con mi código</h1>
        <p>Sirve también si envió el reporte sin su nombre, o si la directiva lo registró por usted.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void buscar();
        }}
      >
        <Campo
          name="codigo"
          etiqueta="Código de seguimiento"
          ayuda="Está en su constancia. Se parece a: Q-2026-00142-K7QM"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={codigo}
          error={error}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <Boton type="submit" icono={Search} anchoCompleto disabled={buscando}>
          {buscando ? "Buscando…" : "Buscar mi reporte"}
        </Boton>
      </form>
      {avance && (
        <div ref={resultado} role="region" aria-label="Resultado de la búsqueda">
          <AvanceReporte
            avance={avance}
            nivel={2}
            hrefOficio={`/api/quejas/seguimiento/${encodeURIComponent(avance.codigo)}/oficio`}
          />
        </div>
      )}
    </div>
  );
}
