"use client";
// @HU-GAR-10

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Contador } from "@/componentes/a11y/Contador";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

type Uso = "VIVIENDA" | "NEGOCIO" | "VIVIENDA_Y_NEGOCIO";
type Concepto = "familias" | "inquilinos" | "autos" | "motos" | "triciclos" | "negocios";
type Ocupacion = { uso: Uso } & Record<Concepto, number>;

const USOS: [Uso, string][] = [
  ["VIVIENDA", "Vivienda"],
  ["NEGOCIO", "Negocio"],
  ["VIVIENDA_Y_NEGOCIO", "Vivienda y negocio"],
];
const CONCEPTOS: [Concepto, string][] = [
  ["familias", "Familias"],
  ["inquilinos", "Inquilinos"],
  ["autos", "Autos o camionetas"],
  ["motos", "Motos"],
  ["triciclos", "Triciclos o carretas"],
  ["negocios", "Locales de negocio"],
];
const nombreUso = (uso: Uso) => USOS.find(([u]) => u === uso)?.[1] ?? uso;

// Lo que ya se sabe llega rellenado: se cambia solo lo que ya no es igual (WCAG 3.3.7).
export function ActualizarPredio({
  predioId,
  direccion,
  actual,
}: {
  predioId: string;
  direccion: string;
  actual: Ocupacion;
}) {
  const [paso, setPaso] = useState<"editar" | "confirmar">("editar");
  const [datos, setDatos] = useState<Ocupacion>(actual);
  const [aviso, setAviso] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const filas: [string, string][] = [
    ...(datos.uso !== actual.uso
      ? [["Uso", `${nombreUso(actual.uso)} → ${nombreUso(datos.uso)}`] as [string, string]]
      : []),
    ...CONCEPTOS.filter(([c]) => datos[c] !== actual[c]).map(
      ([c, etiqueta]) => [etiqueta, `${actual[c]} → ${datos[c]}`] as [string, string],
    ),
  ];

  async function guardar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/admin/padron/${predioId}`, "PATCH", datos);
    if (r.ok) {
      router.push(`/administracion/padron/${predioId}?aviso=actualizado`);
      return;
    }
    setEnviando(false);
    setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea guardar los datos nuevos de ${direccion}?`}
        filas={filas}
        efecto="El cambio queda en el historial de la vivienda. La cuota se recalcula con estos datos desde el siguiente ciclo de cobro."
        textoConfirmar="Sí, guardar los cambios"
        enviando={enviando}
        error={falla}
        alConfirmar={guardar}
        alCorregir={() => setPaso("editar")}
        hrefCancelar={`/administracion/padron/${predioId}`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/administracion/padron/${predioId}`}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a la ficha
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Actualizar los datos de {direccion}
        </h1>
        <p>Ya están los datos de hoy. Cambie solo lo que ya no es igual.</p>
      </div>
      <GrupoOpciones id="campo-uso" pregunta="¿Para qué se usa?">
        {USOS.map(([uso, etiqueta]) => (
          <Opcion
            key={uso}
            tipo="radio"
            name="uso"
            etiqueta={etiqueta}
            checked={datos.uso === uso}
            onChange={() => setDatos({ ...datos, uso })}
          />
        ))}
      </GrupoOpciones>
      <section aria-labelledby="titulo-ocupacion" className="flex flex-col gap-2">
        <h2 id="titulo-ocupacion" className="text-titulo-3">
          ¿Cuántos hay de cada uno?
        </h2>
        <div className="flex flex-col">
          {CONCEPTOS.map(([concepto, etiqueta]) => (
            <Contador
              key={concepto}
              id={`campo-${concepto}`}
              etiqueta={etiqueta}
              valor={datos[concepto]}
              minimo={concepto === "familias" && datos.uso !== "NEGOCIO" ? 1 : 0}
              maximo={9}
              alCambiar={(valor) => setDatos({ ...datos, [concepto]: valor })}
            />
          ))}
        </div>
      </section>
      {aviso && (
        <MensajeEstado tipo="info" titulo="No cambió ningún dato">
          <p>{aviso}</p>
        </MensajeEstado>
      )}
      <Boton
        icono={ArrowRight}
        anchoCompleto
        onClick={() =>
          filas.length ? setPaso("confirmar") : setAviso("Cambie lo que ya no es igual y vuelva a revisar.")
        }
      >
        Revisar el cambio
      </Boton>
    </div>
  );
}
