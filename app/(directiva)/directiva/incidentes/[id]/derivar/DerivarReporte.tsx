"use client";
// @HU-QUE-07

import { ArrowRight, ChevronLeft, FileText, Folder } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

// DIR-QUE-06 (a quién y el expediente) y DIR-QUE-07 (la confirmación).

const ENTIDADES = [
  ["PNP", "Policía Nacional del Perú (PNP)", "Comisaría del sector"],
  ["MUNICIPALIDAD", "Municipalidad", "Serenazgo y fiscalización"],
] as const;

export function DerivarReporte({
  id,
  numero,
  fecha,
  expediente,
}: {
  id: string;
  numero: string;
  fecha: string;
  expediente: [string, string][];
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"elegir" | "confirmar">("elegir");
  const [entidad, setEntidad] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  const nombreEntidad = ENTIDADES.find(([e]) => e === entidad)?.[1] ?? "";

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  async function derivar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/quejas/${id}/derivacion`, "POST", { entidad });
    setEnviando(false);
    if (r.ok) return router.push(`/directiva/incidentes/${id}`);
    if (r.estado === 400) {
      setError(r.campos.entidad);
      setPaso("elegir");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea derivar el reporte a ${nombreEntidad}?`}
        filas={[["Reporte", numero], ["Enviar a", nombreEntidad], ...expediente]}
        efecto="El reporte pasa a Derivado a una entidad externa y quien reportó podrá descargar el oficio. La entrega a la entidad se hace en persona."
        textoConfirmar="Sí, derivar el reporte"
        enviando={enviando}
        error={falla}
        alConfirmar={derivar}
        alCorregir={() => setPaso("elegir")}
        hrefCancelar={`/directiva/incidentes/${id}`}
      />
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!entidad) return setError("Elija a qué entidad lo envía.");
        setError(undefined);
        setPaso("confirmar");
      }}
    >
      <Link
        href={`/directiva/incidentes/${id}`}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al reporte
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Reporte {numero} · {fecha} · Paso 1 de 2
        </p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Derivar a una entidad externa
        </h1>
        <p>Úselo cuando el caso es una falta o un delito que la junta no puede resolver.</p>
      </div>
      <GrupoOpciones id="campo-entidad" pregunta="Enviar a" error={error}>
        {ENTIDADES.map(([valor, etiqueta, ayuda]) => (
          <Opcion
            key={valor}
            tipo="radio"
            name="entidad"
            value={valor}
            etiqueta={`${etiqueta}: ${ayuda.toLowerCase()}`}
            checked={entidad === valor}
            onChange={() => setEntidad(valor)}
            className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
          />
        ))}
      </GrupoOpciones>
      <section
        aria-labelledby="titulo-expediente"
        className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      >
        <h2 id="titulo-expediente" className="inline-flex items-center gap-2 text-titulo-3">
          <Folder aria-hidden className="size-icono" />
          Expediente digital (se arma solo)
        </h2>
        <dl className="flex flex-col gap-3">
          {expediente.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
          <div className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">Oficio de derivación</dt>
            <dd className="font-bold">Su número se asigna al derivar</dd>
          </div>
        </dl>
        {entidad && (
          <a
            href={`/api/quejas/${id}/oficio?entidad=${entidad}`}
            className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
          >
            <FileText aria-hidden className="size-icono" />
            Ver el oficio en PDF (se descarga)
          </a>
        )}
      </section>
      <p>
        Quien reportó verá el estado &quot;Derivado a una entidad externa&quot; y podrá descargar el oficio.
      </p>
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la derivación
      </Boton>
    </form>
  );
}
