"use client";
// @HU-QUE-06

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton } from "@/componentes/a11y/Boton";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

// DIR-QUE-04 (lo que se hizo) y DIR-QUE-05 (cerrar como resuelto): quien reportó recibe el detalle.

const MEDIDAS = [
  ["MEDIACION", "Mediación en persona, con acuerdo"],
  ["LLAMADA_DE_ATENCION", "Llamada de atención al vecino"],
  ["OTRA", "Otra medida"],
] as const;

export function RegistrarSolucion({
  id,
  numero,
  categoria,
}: {
  id: string;
  numero: string;
  categoria: string;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"registrar" | "confirmar">("registrar");
  const [medida, setMedida] = useState<string>("");
  const [detalle, setDetalle] = useState<string>("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (paso === "confirmar") titulo.current?.focus();
  }, [paso]);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!medida) nuevos.medida = "Elija qué medida se tomó.";
    if (!detalle.trim()) nuevos.detalle = "Escriba qué se hizo. Se lo enviaremos a quien reportó.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function guardar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/quejas/${id}/acciones`, "POST", { medida, detalle });
    setEnviando(false);
    if (r.ok) return router.refresh();
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("registrar");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        nivel={2}
        titulo="¿Desea cerrar el caso como resuelto?"
        filas={[
          ["Reporte", `${numero} · ${categoria}`],
          ["Medida", MEDIDAS.find(([m]) => m === medida)?.[1] ?? ""],
          ["Detalle para quien reportó", detalle.trim()],
        ]}
        efecto="El caso pasa a Resuelto y quien reportó recibe este detalle."
        textoConfirmar="Sí, cerrar como resuelto"
        enviando={enviando}
        error={falla}
        alConfirmar={guardar}
        alCorregir={() => setPaso("registrar")}
        hrefCancelar="/directiva/incidentes"
      />
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        revisar();
      }}
    >
      <h2 className="text-titulo-2">Registrar lo que se hizo</h2>
      <GrupoOpciones id="campo-medida" pregunta="¿Qué medida se tomó?" error={errores.medida}>
        {MEDIDAS.map(([valor, etiqueta]) => (
          <Opcion
            key={valor}
            tipo="radio"
            name="medida"
            value={valor}
            etiqueta={etiqueta}
            checked={medida === valor}
            onChange={() => setMedida(valor)}
            className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
          />
        ))}
      </GrupoOpciones>
      <AreaTexto
        name="detalle"
        etiqueta="Detalle para quien reportó"
        ayuda="Por ejemplo: el sábado conversamos con el vecino y acordó bajar la música desde las 10 p. m."
        rows={4}
        maxLength={1000}
        value={detalle}
        error={errores.detalle}
        onChange={(e) => setDetalle(e.target.value)}
      />
      <p>Al guardar, el caso pasa a Resuelto y quien reportó recibe este detalle.</p>
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar y cerrar el caso
      </Boton>
    </form>
  );
}
