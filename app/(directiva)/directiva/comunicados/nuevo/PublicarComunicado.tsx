"use client";
// @HU-ASA-15

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Campo } from "@/componentes/a11y/Campo";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

type Urgencia = "INFORMATIVO" | "URGENTE";
const URGENCIAS: Record<Urgencia, { etiqueta: string; ayuda: string }> = {
  INFORMATIVO: { etiqueta: "Informativo", ayuda: "Un aviso general, sin apuro." },
  URGENTE: {
    etiqueta: "Urgente",
    ayuda: "Algo que los vecinos deben saber hoy. Sale primero en las noticias.",
  },
};

/** `corrige`: el comunicado que se corrige; el formulario empieza con su texto para cambiar solo lo que estaba mal. */
type Corrige = { id: string; titulo: string; cuerpo: string; urgencia: Urgencia };

export function PublicarComunicado({ corrige }: { corrige?: Corrige }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"redactar" | "confirmar">("redactar");
  const [datos, setDatos] = useState({
    titulo: corrige?.titulo ?? "",
    cuerpo: corrige?.cuerpo ?? "",
    urgencia: corrige?.urgencia ?? ("INFORMATIVO" as Urgencia),
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por comunicado: si se reintenta por una falla de red, no se publica dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.titulo.trim()) nuevos.titulo = "Escriba el título del comunicado.";
    if (!datos.cuerpo.trim()) nuevos.cuerpo = "Escriba el mensaje del comunicado.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/transparencia/comunicados", "POST", {
      ...datos,
      idOperacion: idOperacion.current,
      corrigeAId: corrige?.id ?? null,
    });
    setEnviando(false);
    // Publicado: de vuelta a la pantalla anterior (de donde se abrió el formulario), o al resumen si no hay.
    if (r.ok) {
      // Una corrección vuelve a la lista de comunicados, donde ya aparece; un comunicado nuevo, a la pantalla anterior.
      if (corrige) return router.push("/directiva/comunicados");
      return window.history.length > 1 ? router.back() : router.push("/directiva");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("redactar");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={corrige ? "¿Desea publicar la corrección?" : "¿Desea publicar el comunicado?"}
        filas={[
          ...(corrige ? [["Corrige a", corrige.titulo] as [string, string]] : []),
          ["Título", datos.titulo.trim()],
          ["Urgencia", URGENCIAS[datos.urgencia].etiqueta],
          ["Llega a", "Todos los vecinos"],
        ]}
        efecto={
          corrige
            ? "Reemplazará al comunicado anterior en Noticias de la junta y llegará a Avisos de cada vecino como corrección. Una vez publicada ya no se puede cambiar."
            : "Se publicará en Noticias de la junta y aparecerá en Avisos de cada vecino. Una vez publicado ya no se puede cambiar."
        }
        textoConfirmar={corrige ? "Sí, publicar la corrección" : "Sí, publicar el comunicado"}
        enviando={enviando}
        error={falla}
        alConfirmar={publicar}
        alCorregir={() => setPaso("redactar")}
        hrefCancelar={corrige ? `/directiva/comunicados/${corrige.id}` : "/directiva/comunicados"}
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
        href={corrige ? `/directiva/comunicados/${corrige.id}` : "/directiva/comunicados"}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        {corrige ? "Volver al comunicado" : "Volver a comunicados"}
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {corrige ? "Corregir un comunicado" : "Comunicado a la comunidad"}
        </h1>
        <p>
          Para avisos que no son de una asamblea ni de una actividad: cortes de servicio, seguridad o
          trámites.
        </p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <Campo
        name="titulo"
        etiqueta="Título"
        autoComplete="off"
        maxLength={120}
        value={datos.titulo}
        error={errores.titulo}
        onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
      />
      <AreaTexto
        name="cuerpo"
        etiqueta="Mensaje"
        rows={6}
        maxLength={1500}
        value={datos.cuerpo}
        error={errores.cuerpo}
        onChange={(e) => setDatos({ ...datos, cuerpo: e.target.value })}
      />
      <GrupoOpciones id="campo-urgencia" pregunta="¿Qué tan urgente es?" error={errores.urgencia}>
        {(Object.keys(URGENCIAS) as Urgencia[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="urgencia"
            etiqueta={`${URGENCIAS[clave].etiqueta}. ${URGENCIAS[clave].ayuda}`}
            checked={datos.urgencia === clave}
            onChange={() => setDatos({ ...datos, urgencia: clave })}
          />
        ))}
      </GrupoOpciones>
      <p className="text-texto-secundario">
        Se publicará en Noticias de la junta y llegará a Avisos de cada vecino. Los urgentes aparecen primero,
        con la etiqueta Urgente.
      </p>
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el comunicado
      </Boton>
    </form>
  );
}
