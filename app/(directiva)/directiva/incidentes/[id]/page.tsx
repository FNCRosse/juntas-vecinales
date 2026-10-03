import { ChevronLeft, EyeOff, Image as Imagen, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaYHora } from "@/compartido/fechas";
import { verQuejaParaGestion } from "@/modulos/incidencias/aplicacion/gestion";
import { EvaluarReporte } from "./EvaluarReporte";
import { RegistrarSolucion } from "./RegistrarSolucion";

export const metadata: Metadata = { title: "Evaluar un reporte" };

// DIR-QUE-02 a DIR-QUE-05 (HU-QUE-05, HU-QUE-06): lo que se reportó, sus evidencias y la decisión de la directiva.
export default async function ReporteDirectiva({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const q = await verQuejaParaGestion(sesion, (await params).id).catch((e) => {
    if (e instanceof ErrorNoEncontrado) notFound();
    throw e;
  });
  const filas: [string, string | null][] = [
    ["Lugar", q.lugar],
    ["Coordenadas", q.coordenadas],
    ["Quién reporta", q.registradaPor ? `${q.quien} (registró ${q.registradaPor})` : q.quien],
    ["Descripción", q.descripcion],
  ];
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/incidentes"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a incidentes
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Reporte {q.numero} · recibido el {fechaYHora(new Date(q.fechaRegistro))}
        </p>
        <h1 className="text-titulo-1">{q.categoria}</h1>
        <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
          <Info aria-hidden className="size-icono-pequeno" />
          {q.estadoTexto}
        </span>
      </div>
      <section
        aria-labelledby="titulo-reportado"
        className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      >
        <h2 id="titulo-reportado" className="text-titulo-3">
          Lo que reportó
        </h2>
        <dl className="flex flex-col gap-3">
          {filas
            .filter((f): f is [string, string] => !!f[1])
            .map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex flex-col">
                <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
                <dd className="font-bold">{valor}</dd>
              </div>
            ))}
        </dl>
        {q.evidencias.length > 0 ? (
          <ul className="flex flex-col gap-2" aria-label="Evidencias">
            {q.evidencias.map((e) => (
              <li key={e.id}>
                <a
                  href={`/api/archivos/${e.id}`}
                  target="_blank"
                  className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace"
                >
                  <Imagen aria-hidden className="size-icono" />
                  {`Ver ${e.nombre.toLowerCase()} (se abre en otra pestaña)`}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>Sin foto ni video: lo registró el mediador.</p>
        )}
      </section>
      {q.esAnonimo && (
        <MensajeEstado tipo="info" titulo="Pidió no mostrar su nombre">
          <p className="inline-flex items-start gap-2">
            <EyeOff aria-hidden className="size-icono shrink-0" />
            Nadie en la plataforma puede ver quién lo envió. Le avisaremos de cada cambio sin revelar quién
            es.
          </p>
        </MensajeEstado>
      )}
      {q.estado === "RECIBIDO" ? (
        <EvaluarReporte id={q.id} numero={q.numero} categoria={q.categoria} />
      ) : (
        <section
          aria-labelledby="titulo-decision"
          className="flex flex-col gap-2 rounded-control bg-fondo-suave p-4"
        >
          <h2 id="titulo-decision" className="text-titulo-3">
            Decisión de la directiva
          </h2>
          {q.prioridad && <p>Procede, con prioridad {q.prioridad.toLowerCase()}.</p>}
          {q.motivoRechazo && <p>No procede: {q.motivoRechazo}</p>}
          {q.evaluadaPor && <p className="text-texto-secundario">Lo evaluó {q.evaluadaPor}.</p>}
          {q.acciones.map((a) => (
            <div key={a.fecha} className="flex flex-col gap-1 border-t border-borde-sutil pt-2">
              <strong>{a.medida}</strong>
              <p>{a.detalle}</p>
              <p className="text-texto-secundario">
                {a.responsable} · {fechaYHora(new Date(a.fecha))}
              </p>
            </div>
          ))}
        </section>
      )}
      {q.estado === "EN_REVISION" && (
        <RegistrarSolucion id={q.id} numero={q.numero} categoria={q.categoria} />
      )}
    </div>
  );
}
