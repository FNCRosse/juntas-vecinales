"use client";
// @HU-GAR-22

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import type { MotivoBaja } from "@/modulos/identidad/aplicacion/equipo";

export function QuitarAcceso({
  miembro,
  motivos,
}: {
  miembro: { id: string; nombre: string; rolTexto: string; vivienda: string | null };
  motivos: Record<MotivoBaja, string>;
}) {
  const [paso, setPaso] = useState<"motivo" | "confirmar">("motivo");
  const [motivo, setMotivo] = useState<MotivoBaja | null>(null);
  const [error, setError] = useState<string | undefined>();
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

  const descripcion = `${miembro.rolTexto} · ${miembro.vivienda ? `Vive en ${miembro.vivienda}` : "Personal externo"}`;

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ nombre: string }>(`/api/admin/cuentas/${miembro.id}`, "DELETE", { motivo });
    if (r.ok) {
      router.push(
        `/administracion/equipo?${new URLSearchParams({ aviso: "quitado", nombre: r.datos.nombre })}`,
      );
      return;
    }
    setEnviando(false);
    setFalla(r.error);
  }

  if (paso === "confirmar" && motivo) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea quitarle el acceso a ${miembro.nombre}?`}
        filas={[
          ["Persona", miembro.nombre],
          ["Rol", descripcion],
          ["Motivo", motivos[motivo]],
        ]}
        efecto={
          miembro.vivienda
            ? "Su cuenta de equipo quedará desactivada. Su cuenta de vecino sigue igual."
            : "Su cuenta quedará desactivada."
        }
        peligro={{
          titulo: "Su sesión se cierra de inmediato",
          texto:
            "Saldrá de la app en todos sus equipos al momento. Ya no podrá entrar con su acceso de equipo.",
        }}
        textoConfirmar="Sí, quitar el acceso"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("motivo")}
        hrefCancelar="/administracion/equipo"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/equipo"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cuentas del equipo
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Quitar el acceso de {miembro.nombre}
        </h1>
        <p>{descripcion}</p>
      </div>
      <GrupoOpciones id="campo-motivo" pregunta="¿Por qué?" error={error}>
        {(Object.keys(motivos) as MotivoBaja[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="motivo"
            etiqueta={motivos[clave]}
            checked={motivo === clave}
            onChange={() => {
              setMotivo(clave);
              setError(undefined);
            }}
          />
        ))}
      </GrupoOpciones>
      <MensajeEstado tipo="info" titulo="Su sesión se cerrará de inmediato">
        <p>
          Si tiene la app abierta en algún equipo, saldrá al momento. Ya no podrá entrar con su acceso de
          equipo.
        </p>
      </MensajeEstado>
      {miembro.vivienda && <p>Como vive en el barrio, su cuenta de vecino sigue igual.</p>}
      <Boton
        icono={ArrowRight}
        anchoCompleto
        onClick={() => {
          if (!motivo) {
            setError("Elija por qué se le quita el acceso.");
            document.querySelector<HTMLInputElement>("#campo-motivo input")?.focus();
          } else setPaso("confirmar");
        }}
      >
        Revisar
      </Boton>
    </div>
  );
}
