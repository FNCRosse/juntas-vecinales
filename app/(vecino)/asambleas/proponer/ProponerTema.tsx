"use client";
// @HU-ASA-13

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

// VEC-ASA-10: proponer un tema para la agenda. Enviar una propuesta no mueve dinero, ni un voto, ni una queja, y
// la directiva igual la revisa, así que va directo, sin paso de confirmación (R-12).
export function ProponerTema({ asambleaId, hastaCuando }: { asambleaId: string; hastaCuando: string }) {
  const [datos, setDatos] = useState({ titulo: "", justificacion: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  // Un identificador por propuesta: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  async function enviar() {
    const nuevos: Record<string, string> = {};
    if (!datos.titulo.trim()) nuevos.titulo = "Escriba el tema que quiere proponer.";
    if (!datos.justificacion.trim())
      nuevos.justificacion = "Cuéntenos por qué es importante, en unas pocas líneas.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/propuestas`, "POST", {
      ...datos,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) return setEnviada(true);
    if (r.estado === 400) setErrores(r.campos);
    else setFalla(r.error);
  }

  if (enviada) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Recibimos su propuesta">
          <p>Quedó pendiente de revisión. Le avisaremos si la directiva la incluye en la agenda.</p>
        </MensajeEstado>
        <BotonEnlace href="/asambleas">Volver a Asambleas</BotonEnlace>
      </div>
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
        void enviar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Proponer un tema</h1>
        <p>
          Como vecina o vecino, tiene derecho a proponer temas para la asamblea. Puede enviarlo hasta el{" "}
          {hastaCuando}.
        </p>
      </div>
      <ResumenErrores errores={listaErrores} />
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo enviar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Campo
        name="titulo"
        etiqueta="Tema"
        autoComplete="off"
        maxLength={120}
        value={datos.titulo}
        error={errores.titulo}
        onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
      />
      <AreaTexto
        name="justificacion"
        etiqueta="¿Por qué es importante?"
        ayuda="Unas pocas líneas bastan."
        rows={4}
        maxLength={500}
        value={datos.justificacion}
        error={errores.justificacion}
        onChange={(e) => setDatos({ ...datos, justificacion: e.target.value })}
      />
      <Boton type="submit" icono={ArrowRight} cargando={enviando} anchoCompleto>
        Enviar mi propuesta
      </Boton>
    </form>
  );
}
