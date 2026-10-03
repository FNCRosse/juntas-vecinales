"use client";
// @HU-ASA-11

import { ArrowRight, ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

const hoyEnLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

const VACIO = { titulo: "", fechaAsamblea: "", acuerdos: "", compromisos: "", conclusiones: "" };

export function PublicarActa() {
  const [paso, setPaso] = useState<"redactar" | "confirmar" | "publicado">("redactar");
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [previa, setPrevia] = useState<{ url: string } | "cargando" | null>(null);
  const [fallaPrevia, setFallaPrevia] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por acta: si se reintenta por una falla de red, no se publica dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  function cambiar(campo: keyof typeof VACIO, valor: string) {
    setDatos({ ...datos, [campo]: valor });
    setPrevia(null);
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.titulo.trim()) nuevos.titulo = "Escriba el título del acta.";
    if (!datos.fechaAsamblea) nuevos.fechaAsamblea = "Elija la fecha de la asamblea.";
    if (!datos.acuerdos.trim()) nuevos.acuerdos = "Escriba al menos un acuerdo de la asamblea.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function verPdf() {
    setPrevia("cargando");
    setFallaPrevia(null);
    try {
      const respuesta = await fetch("/api/transparencia/actas/vista-previa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (respuesta.ok) return setPrevia({ url: URL.createObjectURL(await respuesta.blob()) });
      const cuerpo = (await respuesta.json().catch(() => null)) as { campos?: Record<string, string> } | null;
      setErrores(cuerpo?.campos ?? {});
      setFallaPrevia("Revise los datos marcados y vuelva a pedir la vista previa.");
    } catch {
      setFallaPrevia("No pudimos conectarnos. Revise su internet y vuelva a intentarlo.");
    }
    setPrevia(null);
  }

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/transparencia/actas", "POST", {
      ...datos,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) return setPaso("publicado");
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("redactar");
    } else setFalla(r.error);
  }

  if (paso === "publicado") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Acta publicada">
          <p>Está en Actas y balances y avisamos a todos los vecinos.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {datos.titulo.trim()}
        </h1>
        <BotonEnlace href="/directiva" icono={FileText}>
          Volver al resumen
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea publicar el acta?"
        filas={[
          ["Título", datos.titulo.trim()],
          ["Asamblea del", datos.fechaAsamblea.split("-").reverse().join("/")],
          ["Acuerdos", `${datos.acuerdos.split(/\r?\n/).filter((l) => l.trim()).length}`],
          ["Llega a", "Todos los vecinos"],
        ]}
        efecto="Se publicará en Actas y balances y avisaremos a todos los vecinos. Una vez publicada ya no se puede cambiar: si hay un error, se publica una nueva."
        textoConfirmar="Sí, publicar el acta"
        enviando={enviando}
        error={falla}
        alConfirmar={publicar}
        alCorregir={() => setPaso("redactar")}
        hrefCancelar="/directiva"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo}`,
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
        href="/directiva"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al resumen
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Acta de la asamblea
        </h1>
        <p>Escriba lo que se acordó. Cada acuerdo y cada compromiso va en una línea.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <Campo
        name="titulo"
        etiqueta="Título del acta"
        autoComplete="off"
        maxLength={120}
        value={datos.titulo}
        error={errores.titulo}
        onChange={(e) => cambiar("titulo", e.target.value)}
      />
      <Campo
        name="fechaAsamblea"
        etiqueta="Fecha de la asamblea"
        type="date"
        max={hoyEnLima()}
        value={datos.fechaAsamblea}
        error={errores.fechaAsamblea}
        onChange={(e) => cambiar("fechaAsamblea", e.target.value)}
      />
      <AreaTexto
        name="acuerdos"
        etiqueta="Acuerdos"
        ayuda="Los puntos que la asamblea aprobó. Uno por línea."
        rows={6}
        value={datos.acuerdos}
        error={errores.acuerdos}
        onChange={(e) => cambiar("acuerdos", e.target.value)}
      />
      <AreaTexto
        name="compromisos"
        etiqueta="Compromisos (opcional)"
        ayuda="Lo que la directiva o los vecinos se comprometieron a hacer. Uno por línea."
        rows={4}
        value={datos.compromisos}
        error={errores.compromisos}
        onChange={(e) => cambiar("compromisos", e.target.value)}
      />
      <AreaTexto
        name="conclusiones"
        etiqueta="Conclusiones (opcional)"
        rows={4}
        value={datos.conclusiones}
        error={errores.conclusiones}
        onChange={(e) => cambiar("conclusiones", e.target.value)}
      />
      <div className="flex flex-col gap-3">
        <Boton
          type="button"
          variante="secundario"
          icono={FileText}
          anchoCompleto
          cargando={previa === "cargando"}
          onClick={verPdf}
        >
          Ver cómo queda el PDF
        </Boton>
        {previa && previa !== "cargando" && (
          <MensajeEstado tipo="info" titulo="La vista previa está lista">
            <a
              href={previa.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-texto-enlace underline underline-offset-4"
            >
              Abrir la vista previa (PDF, se abre en otra pestaña)
            </a>
          </MensajeEstado>
        )}
        {fallaPrevia && (
          <MensajeEstado tipo="error" titulo="No pudimos preparar la vista previa">
            <p>{fallaPrevia}</p>
          </MensajeEstado>
        )}
      </div>
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el acta
      </Boton>
    </form>
  );
}
