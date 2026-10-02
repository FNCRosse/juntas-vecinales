"use client";
// @HU-GAR-09

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";

type Motivo = "MUDANZA" | "FALLECIMIENTO" | "OTRO";
type Residente = { usuarioId: string; etiqueta: string; nombre: string; relacion: string };

const EFECTOS = [
  "Su perfil pasa a inactivo",
  "Se cierra su sesión en su teléfono al momento",
  "Sale de la lista de la garita: la reja ya no se abre para esa persona",
  "Le enviamos un WhatsApp confirmando que ya no tiene accesos",
  "Sus pagos anteriores se conservan",
];

export function DarDeBaja({
  predioId,
  direccion,
  residentes,
  motivos,
}: {
  predioId: string;
  direccion: string;
  residentes: Residente[];
  motivos: Record<Motivo, string>;
}) {
  const [paso, setPaso] = useState<"elegir" | "confirmar">("elegir");
  const [usuarioId, setUsuarioId] = useState<string | null>(
    residentes.length === 1 ? residentes[0].usuarioId : null,
  );
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [errores, setErrores] = useState<{ quien?: string; motivo?: string }>({});
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

  const elegido = residentes.find((r) => r.usuarioId === usuarioId);

  function revisar() {
    const nuevos = {
      quien: elegido ? undefined : "Elija a quién dar de baja.",
      motivo: motivo ? undefined : "Elija por qué se le da de baja.",
    };
    setErrores(nuevos);
    if (nuevos.quien) document.querySelector<HTMLInputElement>("#campo-quien input")?.focus();
    else if (nuevos.motivo) document.querySelector<HTMLInputElement>("#campo-motivo input")?.focus();
    else setPaso("confirmar");
  }

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ nombre: string }>(`/api/admin/padron/${predioId}/desvincular`, "POST", {
      usuarioId,
      motivo,
    });
    if (r.ok) {
      router.push(
        `/administracion/padron/${predioId}?${new URLSearchParams({ aviso: "baja", nombre: r.datos.nombre })}`,
      );
      return;
    }
    setEnviando(false);
    setFalla(r.error);
  }

  if (paso === "confirmar" && elegido && motivo) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea dar de baja a ${elegido.nombre}?`}
        filas={[
          ["Persona", `${elegido.nombre} · ${elegido.relacion.toLowerCase()}`],
          ["Vivienda", direccion],
          ["Motivo", motivos[motivo]],
        ]}
        efecto="Su perfil pasará a inactivo y le enviaremos un WhatsApp confirmando que ya no tiene accesos. Sus pagos anteriores se conservan."
        peligro={{
          titulo: "Se cierra su sesión y sale de la lista de la garita",
          texto: "La reja ya no se abrirá para esa persona y no podrá entrar a la app.",
        }}
        textoConfirmar="Sí, dar de baja"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("elegir")}
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
          Dar de baja a un residente
        </h1>
        <p>{direccion}</p>
      </div>
      <GrupoOpciones id="campo-quien" pregunta="¿A quién?" error={errores.quien}>
        {residentes.map((r) => (
          <Opcion
            key={r.usuarioId}
            tipo="radio"
            name="quien"
            etiqueta={r.etiqueta}
            checked={usuarioId === r.usuarioId}
            onChange={() => setUsuarioId(r.usuarioId)}
          />
        ))}
      </GrupoOpciones>
      <GrupoOpciones id="campo-motivo" pregunta="¿Por qué?" error={errores.motivo}>
        {(Object.keys(motivos) as Motivo[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="motivo"
            etiqueta={motivos[clave]}
            checked={motivo === clave}
            onChange={() => setMotivo(clave)}
          />
        ))}
      </GrupoOpciones>
      <section
        aria-labelledby="titulo-efectos"
        className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6"
      >
        <h2 id="titulo-efectos" className="text-titulo-3">
          Qué va a pasar
        </h2>
        <ul className="flex flex-col gap-2">
          {EFECTOS.map((efecto) => (
            <li key={efecto} className="flex items-start gap-2">
              <ArrowRight aria-hidden className="size-icono shrink-0" />
              {efecto}
            </li>
          ))}
        </ul>
      </section>
      <p>
        Si con esto cambia la cuota (por ejemplo, ya no hay inquilino), actualice después los datos del
        predio.
      </p>
      <Boton icono={ArrowRight} anchoCompleto onClick={revisar}>
        Revisar
      </Boton>
    </div>
  );
}
