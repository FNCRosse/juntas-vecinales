"use client";
// @HU-COB-04

import { ArrowRight, Wallet } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import type { DecisionDeReclamo } from "@/modulos/aportes/aplicacion/decidirReclamos";

type Opcion = { valor: string; titulo: string; detalle: string };

// DIR-COB-13 y DIR-COB-14: aprobar el ajuste o mantener la cuota, en dos pasos. Cambia lo que debe una casa y le avisa, así que
// lleva su confirmación (R-12). Si se mantiene la cuota hay que explicar el motivo, que le llega a la casa.
export function DecidirReclamo({
  reclamoId,
  nombre,
  opciones,
  detalle,
}: {
  reclamoId: string;
  nombre: string;
  opciones: Opcion[];
  /** El reclamo con sus antecedentes (DIR-COB-13): se ve en el paso 1 y no en la confirmación. */
  detalle: ReactNode;
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [decision, setDecision] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DecisionDeReclamo | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const elegida = opciones.find((o) => o.valor === decision);
  const mantiene = decision === "MANTENER";

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!decision) nuevos.decision = "Elija qué decide.";
    if (mantiene && !motivo.trim()) nuevos.motivo = "Escriba el motivo para explicárselo a la casa.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function enviar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<DecisionDeReclamo>(`/api/aportes/ajustes/${reclamoId}`, "PATCH", {
      decision,
      motivo: mantiene ? motivo : "",
    });
    setEnviando(false);
    if (r.ok) {
      setResultado(r.datos);
      return setPaso("hecho");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "hecho" && resultado) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Decisión enviada">
          <p>
            {resultado.aplicado
              ? `La cuota de ${nombre} ahora es ${resultado.cuotaAhora}. Ya le avisamos.`
              : "Este reclamo ya estaba respondido. No cambiamos nada."}
          </p>
        </MensajeEstado>
        <BotonEnlace href="/directiva/cobros" icono={Wallet}>
          Volver a Cobros
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar" && elegida) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea enviar esta decisión?"
        filas={[
          ["Vecino", nombre],
          ["Decisión", elegida.titulo],
          ...(mantiene ? [["Motivo", motivo.trim()] as [string, string]] : []),
        ]}
        efecto={
          mantiene
            ? `La cuota no cambia. Le enviaremos el motivo a ${nombre}.`
            : `La cuota se recalcula ahora: ${elegida.detalle.replace(/^Se quita el concepto [^:]+: la cuota /, "")}. Le avisaremos el nuevo monto a ${nombre}.`
        }
        textoConfirmar="Sí, enviar la decisión"
        enviando={enviando}
        error={falla}
        alConfirmar={enviar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/cobros"
        textoCancelar="Cancelar, no guardar nada"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {detalle}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          revisar();
        }}
        className="flex flex-col gap-6"
      >
        <SelectorEnHoja
          id="campo-decision"
          pregunta="¿Qué decide?"
          vacio="Elegir qué decide"
          opciones={opciones.map((o) => ({ valor: o.valor, etiqueta: o.titulo, detalle: o.detalle }))}
          valor={decision}
          alElegir={(valor) => {
            setDecision(valor);
            setErrores({});
          }}
          error={errores.decision}
        />
        {mantiene && (
          <AreaTexto
            name="motivo"
            etiqueta={`Motivo (se lo enviaremos a ${nombre})`}
            rows={3}
            maxLength={300}
            value={motivo}
            error={errores.motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              setErrores({ ...errores, motivo: "" });
            }}
          />
        )}
        <Boton type="submit" icono={ArrowRight} anchoCompleto>
          Revisar la decisión
        </Boton>
      </form>
    </div>
  );
}
