"use client";
// @HU-QUE-05

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

// DIR-QUE-02 (la decisión) y DIR-QUE-03 (la confirmación). Rechazar envía una advertencia sin tono punitivo.

const DECISIONES = [
  ["admitir", "Procede: pasar a En revisión", ""],
  ["rechazar", "No procede: es falso o malintencionado", "Se enviará una advertencia por mal uso"],
] as const;
const PRIORIDADES = [
  ["ALTA", "Alta", "Riesgo para personas o bienes"],
  ["MEDIA", "Media", ""],
  ["BAJA", "Baja", ""],
] as const;

export function EvaluarReporte({ id, numero, categoria }: { id: string; numero: string; categoria: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"decidir" | "confirmar">("decidir");
  const [decision, setDecision] = useState<string>("");
  const [prioridad, setPrioridad] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (paso === "confirmar") titulo.current?.focus();
  }, [paso]);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!decision) nuevos.decision = "Elija qué decide.";
    if (decision === "admitir" && !prioridad) nuevos.prioridad = "Elija la prioridad.";
    if (decision === "rechazar" && !motivo.trim())
      nuevos.motivo = "Escriba por qué no procede. Se lo diremos a quien reportó.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function guardar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(
      `/api/quejas/${id}/admisibilidad`,
      "PATCH",
      decision === "admitir" ? { decision, prioridad } : { decision, motivo },
    );
    setEnviando(false);
    if (r.ok) return router.refresh();
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("decidir");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    const admite = decision === "admitir";
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={
          admite ? "¿Desea pasar el reporte a En revisión?" : "¿Desea marcar el reporte como No procede?"
        }
        filas={[
          ["Reporte", `${numero} · ${categoria}`],
          admite
            ? ["Prioridad", PRIORIDADES.find(([p]) => p === prioridad)?.[1] ?? ""]
            : ["Motivo", motivo.trim()],
        ]}
        efecto={
          admite
            ? "Le avisaremos a quien reportó que su reporte procede y está en revisión."
            : "Le avisaremos a quien reportó que no procede, con este motivo y un recordatorio amable de usar bien los reportes."
        }
        textoConfirmar={admite ? "Sí, pasar a En revisión" : "Sí, marcar como No procede"}
        enviando={enviando}
        error={falla}
        alConfirmar={guardar}
        alCorregir={() => setPaso("decidir")}
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
      <GrupoOpciones id="campo-decision" pregunta="¿Qué decide?" error={errores.decision}>
        {DECISIONES.map(([valor, etiqueta, ayuda]) => (
          <Opcion
            key={valor}
            tipo="radio"
            name="decision"
            value={valor}
            etiqueta={ayuda ? `${etiqueta}. ${ayuda}` : etiqueta}
            checked={decision === valor}
            onChange={() => setDecision(valor)}
            className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
          />
        ))}
      </GrupoOpciones>
      {decision === "admitir" && (
        <GrupoOpciones id="campo-prioridad" pregunta="Prioridad" error={errores.prioridad}>
          {PRIORIDADES.map(([valor, etiqueta, ayuda]) => (
            <Opcion
              key={valor}
              tipo="radio"
              name="prioridad"
              value={valor}
              etiqueta={ayuda ? `${etiqueta}: ${ayuda.toLowerCase()}` : etiqueta}
              checked={prioridad === valor}
              onChange={() => setPrioridad(valor)}
              className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
            />
          ))}
        </GrupoOpciones>
      )}
      {decision === "rechazar" && (
        <>
          <MensajeEstado tipo="aviso" titulo="Se enviará una advertencia">
            <p>Si es falso o busca dañar a alguien, avisaremos a quien lo envió que es un mal uso.</p>
          </MensajeEstado>
          <AreaTexto
            name="motivo"
            etiqueta="Motivo"
            ayuda="Se lo diremos a quien reportó. Escríbalo con respeto."
            rows={3}
            maxLength={500}
            value={motivo}
            error={errores.motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la decisión
      </Boton>
    </form>
  );
}
