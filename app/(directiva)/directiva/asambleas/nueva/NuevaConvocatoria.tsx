"use client";
// @HU-ASA-01

import { ArrowRight, CalendarDays, ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace, clasesBoton } from "@/componentes/a11y/Boton";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import type { AsambleaDto } from "@/modulos/asambleas/aplicacion/convocatorias";

type TipoAsamblea = "ORDINARIA" | "EXTRAORDINARIA";
const TIPOS: { valor: TipoAsamblea; etiqueta: string; detalle: string }[] = [
  { valor: "ORDINARIA", etiqueta: "Ordinaria", detalle: "La reunión regular de la junta." },
  {
    valor: "EXTRAORDINARIA",
    etiqueta: "Extraordinaria",
    detalle: "Para un tema puntual que no puede esperar a la ordinaria.",
  },
];

/** "2026-11-14" y "18:00" → "Sábado 14 de noviembre de 2026, 6:00 p. m." para la revisión. */
function enPalabras(fecha: string, hora: string) {
  if (!fecha || !hora) return "";
  const cuando = new Date(`${fecha}T${hora}:00-05:00`);
  if (Number.isNaN(cuando.getTime())) return "";
  const dia = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(cuando)
    .replace(",", "");
  const horaTexto = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    timeStyle: "short",
    hour12: true,
  })
    .format(cuando)
    .replace(/[  ]/g, " ");
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${horaTexto}`;
}

export function NuevaConvocatoria() {
  const [paso, setPaso] = useState<"redactar" | "confirmar" | "publicada">("redactar");
  const [datos, setDatos] = useState({
    tipoAsamblea: null as TipoAsamblea | null,
    fecha: "",
    hora: "",
    lugar: "",
    motivo: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [publicada, setPublicada] = useState<AsambleaDto | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
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
    if (!datos.tipoAsamblea) nuevos.tipoAsamblea = "Elija si la asamblea es ordinaria o extraordinaria.";
    if (!datos.fecha || !datos.hora) nuevos.fechaHora = "Indique la fecha y la hora de la asamblea.";
    if (!datos.lugar.trim()) nuevos.lugar = "Escriba el lugar de la asamblea.";
    if (!datos.motivo.trim()) nuevos.motivo = "Escriba el motivo de la asamblea.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/asambleas", "POST", { ...datos, idOperacion: idOperacion.current });
    setEnviando(false);
    if (r.ok) {
      setPublicada(r.datos as AsambleaDto);
      return setPaso("publicada");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("redactar");
    } else setFalla(r.error);
  }

  if (paso === "publicada" && publicada) return <Afiche asamblea={publicada} referencia={titulo} />;

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea publicar la convocatoria?"
        filas={[
          [
            "Tipo",
            datos.tipoAsamblea === "EXTRAORDINARIA" ? "Asamblea extraordinaria" : "Asamblea ordinaria",
          ],
          ["Fecha y hora", enPalabras(datos.fecha, datos.hora)],
          ["Lugar", datos.lugar.trim()],
          ["Llega a", "Todos los vecinos"],
        ]}
        efecto="Se publicará en Asambleas, avisaremos a cada vecino y se podrá imprimir el afiche. Una vez publicada ya no se puede cambiar."
        textoConfirmar="Sí, publicar la convocatoria"
        enviando={enviando}
        error={falla}
        alConfirmar={publicar}
        alCorregir={() => setPaso("redactar")}
        hrefCancelar="/directiva/asambleas"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: campo === "fechaHora" ? "campo-fecha" : `campo-${campo}`,
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
        href="/directiva/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Nueva convocatoria
        </h1>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-tipoAsamblea"
        pregunta="Tipo de asamblea"
        vacio="Elegir el tipo"
        opciones={TIPOS}
        valor={datos.tipoAsamblea}
        alElegir={(tipoAsamblea) => setDatos({ ...datos, tipoAsamblea })}
        error={errores.tipoAsamblea}
      />
      <div className="flex flex-col gap-3">
        <Campo
          type="date"
          name="fecha"
          etiqueta="Fecha"
          value={datos.fecha}
          error={errores.fechaHora}
          onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
        />
        <Campo
          type="time"
          name="hora"
          etiqueta="Hora"
          value={datos.hora}
          onChange={(e) => setDatos({ ...datos, hora: e.target.value })}
        />
      </div>
      <Campo
        name="lugar"
        etiqueta="Lugar"
        autoComplete="off"
        maxLength={160}
        value={datos.lugar}
        error={errores.lugar}
        onChange={(e) => setDatos({ ...datos, lugar: e.target.value })}
      />
      <AreaTexto
        name="motivo"
        etiqueta="Motivo"
        rows={5}
        maxLength={1500}
        ayuda="Las propuestas vecinales que incluya en la agenda se agregan solas a la convocatoria."
        value={datos.motivo}
        error={errores.motivo}
        onChange={(e) => setDatos({ ...datos, motivo: e.target.value })}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la convocatoria
      </Boton>
    </form>
  );
}

/** DIR-ASA-04: convocatoria publicada con el afiche imprimible (los mismos datos de la publicación). */
function Afiche({
  asamblea,
  referencia,
}: {
  asamblea: AsambleaDto;
  referencia: React.RefObject<HTMLHeadingElement | null>;
}) {
  const fecha = new Date(asamblea.fechaHora);
  const dia = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(fecha)
    .replace(",", "");
  const hora = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    timeStyle: "short",
    hour12: true,
  })
    .format(fecha)
    .replace(/[  ]/g, " ");
  return (
    <div className="flex flex-col gap-6">
      <MensajeEstado tipo="exito" titulo="Convocatoria publicada">
        <p>Está en Asambleas y avisamos a cada vecino por la app.</p>
      </MensajeEstado>
      <h1 ref={referencia} tabIndex={-1} className="text-titulo-1">
        Afiche para pegar en el barrio
      </h1>
      <section
        aria-label="Afiche de la asamblea"
        className="flex flex-col gap-2 rounded-tarjeta border border-borde-fuerte bg-fondo-superficie p-6 text-center"
      >
        <p className="font-bold">Junta Vecinal de Villa de Fátima</p>
        <p className="text-titulo-2">{asamblea.titulo}</p>
        <p className="font-bold">
          {dia.charAt(0).toUpperCase()}
          {dia.slice(1)}
        </p>
        <p>
          {hora} · {asamblea.lugar}
        </p>
        <p className="pt-2 font-bold">Motivo</p>
        <p>{asamblea.motivo}</p>
        <p className="pt-2 text-texto-secundario">
          Confirme su asistencia en la app o con un mediador de la directiva.
        </p>
      </section>
      <p className="text-texto-secundario">
        El afiche usa los mismos datos de la publicación en la app: fecha, hora, lugar y motivo.
      </p>
      <div className="flex flex-col items-start gap-separacion">
        <Boton type="button" icono={Printer} variante="secundario" onClick={() => window.print()}>
          Imprimir el afiche
        </Boton>
        <a
          href={`/api/asambleas/${asamblea.id}/afiche`}
          className={clasesBoton("secundario")}
          target="_blank"
          rel="noopener"
        >
          Descargar en PDF
        </a>
        <BotonEnlace href="/directiva/asambleas" icono={CalendarDays}>
          Volver a asambleas
        </BotonEnlace>
      </div>
    </div>
  );
}
