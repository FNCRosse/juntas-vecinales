"use client";
// @HU-ASA-05

import { ArrowRight, CalendarDays, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { fechaHoraEnPalabras, SelectorFechaHora } from "@/componentes/a11y/SelectorFechaHora";

type Decision = "REPROGRAMAR" | "INFORMATIVA";

const OPCIONES: Record<Decision, { titulo: string; detalle: string; resumen: string }> = {
  REPROGRAMAR: {
    titulo: "Reprogramar la asamblea",
    detalle: "Se elige una fecha nueva y se avisa a todos",
    resumen: "Reprogramar la asamblea",
  },
  INFORMATIVA: {
    titulo: "Convertirla en sesión informativa",
    detalle: "Se hace la reunión, pero sin votaciones ni acuerdos",
    resumen: "Sesión informativa",
  },
};

// DIR-ASA-07 y DIR-ASA-08: qué hacer con una asamblea que no llegó al quórum, en dos pasos. La decisión avisa
// a toda la comunidad y no se puede deshacer, así que lleva su paso de confirmación (R-12).
export function DecidirSinQuorum({
  asambleaId,
  titulo: tituloAsamblea,
  cuando,
  corte,
  confirmados,
  padronTotal,
  requerido,
  faltan,
}: {
  asambleaId: string;
  titulo: string;
  /** "sábado 10 de octubre" para la pregunta y la revisión. */
  cuando: string;
  corte: string;
  confirmados: number;
  padronTotal: number;
  requerido: number;
  faltan: number;
}) {
  const [paso, setPaso] = useState<"elegir" | "confirmar" | "hecho">("elegir");
  const [decision, setDecision] = useState<Decision>("REPROGRAMAR");
  const [nueva, setNueva] = useState({ fecha: "", hora: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (decision === "REPROGRAMAR" && (!nueva.fecha || !nueva.hora)) {
      nuevos.nuevaFechaHora = "Indique la nueva fecha y la hora de la asamblea.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function registrar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/contingencia`, "PATCH", {
      decision,
      ...(decision === "REPROGRAMAR" ? nueva : {}),
    });
    setEnviando(false);
    if (r.ok) return setPaso("hecho");
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("elegir");
    } else setFalla(r.error);
  }

  if (paso === "hecho") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Decisión registrada">
          <p>Ya avisamos a las {padronTotal} casas.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {decision === "REPROGRAMAR" ? "Asamblea reprogramada" : "Será una sesión informativa"}
        </h1>
        <p>
          {decision === "REPROGRAMAR"
            ? `La nueva fecha es ${fechaHoraEnPalabras(nueva.fecha, nueva.hora)}.`
            : "Avisamos a la comunidad que no se votará ni se tomarán acuerdos."}
        </p>
        <BotonEnlace href="/directiva/asambleas" icono={CalendarDays}>
          Volver a asambleas
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea registrar esta decisión?"
        filas={[
          ["Asamblea", `${tituloAsamblea} del ${cuando}`],
          ["Quórum al corte", `${confirmados} de ${padronTotal} casas`],
          ["Decisión", OPCIONES[decision].resumen],
          ...(decision === "REPROGRAMAR"
            ? ([["Nueva fecha", fechaHoraEnPalabras(nueva.fecha, nueva.hora)]] as [string, string][])
            : []),
        ]}
        efecto={
          decision === "REPROGRAMAR"
            ? `Avisaremos a las ${padronTotal} casas la nueva fecha.`
            : "Avisaremos a la comunidad que la reunión será solo informativa: no se votará ni se tomarán acuerdos."
        }
        textoConfirmar="Sí, registrar la decisión"
        enviando={enviando}
        error={falla}
        alConfirmar={registrar}
        alCorregir={() => setPaso("elegir")}
        hrefCancelar="/directiva/asambleas"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: campo === "nuevaFechaHora" ? "campo-nueva-fecha" : `campo-${campo}`,
    mensaje,
  }));
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        revisar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/directiva/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          No se llegó al quórum
        </h1>
        <p>
          Al corte del {corte} confirmaron {confirmados} de {padronTotal} casas. El mínimo es {requerido}:{" "}
          {faltan === 1 ? "faltó 1" : `faltaron ${faltan}`}.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h2 className="text-titulo-2">
          ¿Qué hacemos con la asamblea del {cuando}?
        </h2>
      </div>
      <ResumenErrores errores={listaErrores} />
      <GrupoOpciones id="campo-decision" pregunta="Elija una opción" error={errores.decision}>
        {(Object.keys(OPCIONES) as Decision[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="decision"
            etiqueta={`${OPCIONES[clave].titulo}. ${OPCIONES[clave].detalle}`}
            checked={decision === clave}
            onChange={() => setDecision(clave)}
          />
        ))}
      </GrupoOpciones>
      {decision === "REPROGRAMAR" && (
        <SelectorFechaHora
          id="campo-nueva-fecha"
          pregunta="Nueva fecha"
          fecha={nueva.fecha}
          hora={nueva.hora}
          alCambiar={setNueva}
          error={errores.nuevaFechaHora}
        />
      )}
      {decision === "INFORMATIVA" && (
        <MensajeEstado tipo="info" titulo="Sin votaciones">
          <p>
            En una sesión informativa se presentan informes, pero no se vota ni se toman acuerdos. Así se lo
            avisaremos a todos.
          </p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la decisión
      </Boton>
    </form>
  );
}
