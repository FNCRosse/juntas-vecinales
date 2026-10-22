"use client";
// @HU-COB-10

import { ArrowRight, ChevronLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { soles } from "@/compartido/dinero";

type Motivo = { valor: string; etiqueta: string };

// DIR-COB-05 y DIR-COB-06: marcar un pago como observado, en dos pasos. El motivo va en una hoja para no pasar de los
// objetivos permitidos (R-11). Observar avisa a la vecina y no se deshace desde aquí, así que lleva su confirmación (R-12).
export function ObservarPago({
  comprobanteId,
  nombre,
  monto,
  motivos,
}: {
  comprobanteId: string;
  nombre: string;
  monto: number;
  motivos: Motivo[];
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "observado">("datos");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const etiquetaDelMotivo = motivos.find((m) => m.valor === motivo)?.etiqueta ?? "";
  const esOtro = motivo === "OTRO";

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!motivo) nuevos.motivo = "Elija por qué lo observa.";
    if (esOtro && !nota.trim()) nuevos.nota = "Escriba cuál es el motivo.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function observar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ aplicado: boolean }>(
      `/api/aportes/comprobantes/${comprobanteId}/observar`,
      "PATCH",
      { motivo, nota },
    );
    setEnviando(false);
    if (r.ok) return setPaso("observado");
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "observado") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Pago observado">
          <p>Avisamos a {nombre} el motivo. Podrá enviar otra foto.</p>
        </MensajeEstado>
        <BotonEnlace href="/directiva/cobros" icono={Wallet}>
          Volver a Cobros
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea marcar este pago como observado?"
        filas={[
          ["Vecino", nombre],
          ["Monto", soles(monto)],
          ["Motivo", etiquetaDelMotivo],
          ...(nota.trim() ? [["Nota", nota.trim()] as [string, string]] : []),
        ]}
        efecto={`Le avisaremos el motivo a ${nombre}. Podrá enviar otra foto o pagar la diferencia desde la app.`}
        textoConfirmar="Sí, marcar como observado"
        enviando={enviando}
        error={falla}
        alConfirmar={observar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/cobros"
        textoCancelar="Cancelar, no guardar nada"
      />
    );
  }

  const listaErrores = Object.entries(errores)
    .filter(([, mensaje]) => mensaje)
    .map(([campo, mensaje]) => ({ campo: `campo-${campo}`, mensaje }));
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
        href={`/directiva/cobros/comprobantes/${comprobanteId}`}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al comprobante
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Marcar el pago como observado
        </h1>
        <p>
          El pago de {nombre} ({soles(monto)}) quedará observado hasta que lo corrija.
        </p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-motivo"
        pregunta="¿Por qué lo observa?"
        vacio="Elegir el motivo"
        opciones={motivos}
        valor={motivo}
        alElegir={(valor) => {
          setMotivo(valor);
          setErrores({ ...errores, motivo: "" });
        }}
        error={errores.motivo}
      />
      <AreaTexto
        name="nota"
        etiqueta={esOtro ? "Cuál es el motivo" : "Nota para el vecino (opcional)"}
        ayuda="Le avisaremos el motivo y podrá enviar otra foto o pagar la diferencia desde la app."
        rows={3}
        maxLength={300}
        value={nota}
        error={errores.nota}
        onChange={(e) => {
          setNota(e.target.value);
          setErrores({ ...errores, nota: "" });
        }}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la observación
      </Boton>
    </form>
  );
}
