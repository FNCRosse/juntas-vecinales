"use client";
// @HU-GAR-13 @HU-GAR-16 @HU-GAR-17

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { MensajeDeCampo } from "@/componentes/a11y/Campo";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import type { Verificacion } from "@/modulos/identidad/aplicacion/arco";

type Solicitud = {
  id: string;
  numero: string;
  tipoTexto: string;
  titulo: string;
  nombre: string;
  quien: string;
  plazoTexto: string;
  pendiente: boolean;
  insignia: { tipo: string; texto: string };
  vence: string;
  campo: string | null;
  antes: string | null;
  nuevo: string | null;
  detalle: string | null;
  motivoResolucion: string | null;
  pideVerificacion: boolean;
  verificacion: string | null;
};

const VOLVER = "/administracion/privacidad";

export function ResolverSolicitud({
  solicitud: s,
  verificaciones,
}: {
  solicitud: Solicitud;
  verificaciones: Record<Verificacion, string>;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"decidir" | "confirmar">("decidir");
  const [aprobar, setAprobar] = useState<boolean | null>(null);
  const [motivo, setMotivo] = useState("");
  const [verificacion, setVerificacion] = useState<Verificacion | null>(null);
  const [errores, setErrores] = useState<{ decision?: string; motivo?: string; verificacion?: string }>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    // El cambio de número tiene su propia ruta, con la verificación de identidad (HU-GAR-17).
    const r = s.pideVerificacion
      ? await enviarJson(`/api/admin/contacto/${s.id}`, "PATCH", {
          aprobar,
          motivo: motivo || undefined,
          verificacion: aprobar ? verificacion : undefined,
        })
      : await enviarJson(`/api/arco/solicitudes/${s.id}`, "PATCH", { aprobar, motivo: motivo || undefined });
    if (r.ok) return router.push(`${VOLVER}?${new URLSearchParams({ aviso: "resuelta", numero: s.numero })}`);
    setEnviando(false);
    setFalla(r.error);
  }

  function revisar() {
    const faltan = {
      verificacion:
        s.pideVerificacion && aprobar && !verificacion
          ? "Indique cómo se verificó su identidad antes de cambiar el número."
          : undefined,
      decision: aprobar === null ? "Elija qué decide." : undefined,
      motivo:
        aprobar === false && !motivo.trim() ? "Escriba el motivo: se lo enviaremos al vecino." : undefined,
    };
    setErrores(faltan);
    if (!faltan.decision && !faltan.motivo && !faltan.verificacion) setPaso("confirmar");
  }

  const volver = (
    <Link
      href={VOLVER}
      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
    >
      <ChevronLeft aria-hidden className="size-icono" />
      Volver a solicitudes
    </Link>
  );

  if (!s.pendiente) {
    return (
      <div className="flex flex-col gap-6">
        {volver}
        <h1 className="text-titulo-1">
          {s.titulo} · {s.nombre}
        </h1>
        <MensajeEstado tipo="info" titulo="Esta solicitud ya está resuelta">
          <p>{s.plazoTexto}</p>
          {s.motivoResolucion && <p>Motivo: {s.motivoResolucion}</p>}
        </MensajeEstado>
      </div>
    );
  }

  if (paso === "confirmar" && aprobar !== null) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea ${aprobar ? "aprobar" : "rechazar"} esta corrección?`}
        filas={[
          ["Solicitud", `N.° ${s.numero} · ${s.nombre}`],
          ["Dato", s.campo ?? s.titulo],
          ["Antes", s.antes ?? "—"],
          ["Después", s.nuevo ?? "—"],
          ...(aprobar && verificacion
            ? [["Verificación", verificaciones[verificacion]] as [string, string]]
            : []),
          ["Decisión", aprobar ? "Aprobar" : `Rechazar. Motivo: ${motivo.trim()}`],
        ]}
        efecto={
          aprobar
            ? s.pideVerificacion
              ? "Actualizaremos el número en el padrón y enviaremos una confirmación al número anterior y al nuevo."
              : "Actualizaremos el dato en el padrón y le avisaremos al vecino."
            : "El dato no cambia. Le enviaremos el motivo al vecino."
        }
        textoConfirmar={aprobar ? "Sí, aprobar la corrección" : "Sí, rechazar la corrección"}
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("decidir")}
        hrefCancelar={VOLVER}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {volver}
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Solicitud N.° {s.numero} · {s.tipoTexto.toLowerCase()} · Paso 1 de 2
        </p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {s.titulo} de {s.nombre}
        </h1>
        <p>{s.quien}</p>
      </div>
      <MensajeEstado tipo={s.insignia.tipo === "info" ? "info" : "aviso"} titulo={s.insignia.texto}>
        <p>
          {s.plazoTexto}. El plazo legal vence el {s.vence}.
        </p>
      </MensajeEstado>
      <dl className="grid grid-cols-1 gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta sm:grid-cols-2 senior:p-6">
        <div className="flex flex-col">
          <dt className="text-pequeno text-texto-secundario">Dato actual</dt>
          <dd className="font-bold">{s.antes}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-pequeno text-texto-secundario">Dato nuevo</dt>
          <dd className="font-bold">{s.nuevo}</dd>
        </div>
        <div className="flex flex-col sm:col-span-2">
          <dt className="text-pequeno text-texto-secundario">Sustento</dt>
          <dd>{s.detalle ?? "No escribió un sustento."}</dd>
        </div>
      </dl>
      {s.pideVerificacion && (
        <>
          <MensajeEstado tipo="info" titulo="Primero hay que verificar que es la persona">
            <p>
              A este número le llega el enlace de entrada. Por eso se confirma su identidad en persona o con
              su DNI.
            </p>
          </MensajeEstado>
          <GrupoOpciones
            id="campo-verificacion"
            pregunta="¿Cómo se verificó su identidad?"
            error={errores.verificacion}
          >
            {(Object.keys(verificaciones) as Verificacion[]).map((v) => (
              <Opcion
                key={v}
                tipo="radio"
                name="verificacion"
                etiqueta={verificaciones[v]}
                checked={verificacion === v}
                onChange={() => setVerificacion(v)}
              />
            ))}
          </GrupoOpciones>
        </>
      )}
      <GrupoOpciones id="campo-decision" pregunta="¿Qué decide?" error={errores.decision}>
        <Opcion
          tipo="radio"
          name="decision"
          etiqueta="Aprobar la corrección"
          checked={aprobar === true}
          onChange={() => setAprobar(true)}
        />
        <Opcion
          tipo="radio"
          name="decision"
          etiqueta="Rechazar (tendrá que explicar el motivo)"
          checked={aprobar === false}
          onChange={() => setAprobar(false)}
        />
      </GrupoOpciones>
      {aprobar === false && (
        <div className="flex flex-col gap-3">
          <label htmlFor="campo-motivo" className="font-bold">
            Motivo (se lo enviaremos al vecino)
          </label>
          <textarea
            id="campo-motivo"
            rows={3}
            maxLength={500}
            value={motivo}
            aria-invalid={errores.motivo ? true : undefined}
            aria-describedby={errores.motivo ? "campo-motivo-error" : undefined}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 text-base text-texto-principal hover:border-borde-fuerte aria-invalid:border-borde-error"
          />
          {errores.motivo && <MensajeDeCampo id="campo-motivo-error">{errores.motivo}</MensajeDeCampo>}
        </div>
      )}
      <Boton icono={ArrowRight} anchoCompleto onClick={revisar}>
        Revisar la decisión
      </Boton>
    </div>
  );
}
