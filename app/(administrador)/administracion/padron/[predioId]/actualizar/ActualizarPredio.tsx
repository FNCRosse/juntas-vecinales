"use client";
// @HU-GAR-10

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { CamposPlacas, type PlacasEscritas } from "../../_componentes/CamposPlacas";
import { ConceptosDelPredio } from "../../_componentes/ConceptosDelPredio";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

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
  placasActuales,
}: {
  predioId: string;
  direccion: string;
  actual: Ocupacion;
  placasActuales: PlacasEscritas;
}) {
  const [paso, setPaso] = useState<"editar" | "confirmar">("editar");
  const [datos, setDatos] = useState<Ocupacion>(actual);
  const [placas, setPlacas] = useState<PlacasEscritas>(placasActuales);
  const [errores, setErrores] = useState<Record<string, string>>({});
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

  const ver = (lista: string[], cantidad: number) =>
    lista
      .slice(0, cantidad)
      .map((p) => p.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
      .sort()
      .join(", ") || "ninguna";
  const filas: [string, string][] = [
    ...(datos.uso !== actual.uso
      ? [["Uso", `${nombreUso(actual.uso)} → ${nombreUso(datos.uso)}`] as [string, string]]
      : []),
    ...CONCEPTOS.filter(([c]) => datos[c] !== actual[c]).map(
      ([c, etiqueta]) => [etiqueta, `${actual[c]} → ${datos[c]}`] as [string, string],
    ),
    ...(["autos", "motos"] as const)
      .filter((t) => ver(placas[t], datos[t]) !== ver(placasActuales[t], actual[t]))
      .map(
        (t) =>
          [
            t === "autos" ? "Placas de autos" : "Placas de motos",
            `${ver(placasActuales[t], actual[t])} → ${ver(placas[t], datos[t])}`,
          ] as [string, string],
      ),
  ];

  async function guardar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/admin/padron/${predioId}`, "PATCH", { ...datos, placas });
    if (r.ok) {
      router.push(`/administracion/padron/${predioId}?aviso=actualizado`);
      return;
    }
    setEnviando(false);
    if (r.estado === 400 && Object.keys(r.campos).length) {
      setErrores(
        Object.fromEntries(Object.entries(r.campos).map(([c, m]) => [c.replace(/^placas\./, ""), m])),
      );
      setPaso("editar");
    } else setFalla(r.error);
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
      <SelectorEnHoja
        id="campo-uso"
        pregunta="¿Para qué se usa?"
        opciones={USOS.map(([valor, etiqueta]) => ({ valor, etiqueta }))}
        valor={datos.uso}
        alElegir={(uso) => setDatos({ ...datos, uso })}
      />
      <ConceptosDelPredio
        idBase="campo"
        valores={datos}
        esNegocio={datos.uso === "NEGOCIO"}
        alCambiar={(concepto, valor) => setDatos({ ...datos, [concepto]: valor })}
      />
      <CamposPlacas
        autos={datos.autos}
        motos={datos.motos}
        placas={placas}
        errores={errores}
        alCambiar={setPlacas}
      />
      <ResumenErrores
        errores={Object.entries(errores).map(([campo, mensaje]) => ({
          campo: `campo-placas.${campo}`,
          mensaje,
        }))}
      />
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
