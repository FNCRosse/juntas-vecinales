import { ChevronLeft, FileText, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verReclamoParaDecidir } from "@/modulos/aportes/aplicacion/decidirReclamos";
import { DecidirReclamo } from "./DecidirReclamo";

export const metadata: Metadata = { title: "Revisar un reclamo" };

// DIR-COB-13 (HU-COB-04 CA1): el reclamo con su documento y los antecedentes de la casa, y qué pasaría al aprobarlo. Solo la
// directiva decide, y nunca sobre su propia casa; el mediador lo ve.
export default async function RevisarReclamo({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const r = await verReclamoParaDecidir(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const detalle = (
    <>
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a reclamos
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Reclamo de cuota N.° {r.numero}</p>
        <h1 className="text-titulo-1">Reclamo de {r.nombre}</h1>
        <p>
          {r.vivienda} · enviado el {r.enviado}
        </p>
      </div>
      <section aria-labelledby="titulo-pide" className="flex flex-col gap-3">
        <h2 id="titulo-pide" className="text-titulo-2">
          Lo que pide
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            ["Motivo", r.motivo],
            ...(r.detalle ? [["Lo que cuenta", r.detalle]] : []),
            ["Cuota actual", r.cuotaActual],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
        {r.documento && (
          <Link
            href={`/api/archivos/${r.documento.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace underline underline-offset-4"
          >
            <FileText aria-hidden className="size-icono" />
            Ver el documento (se abre en otra pestaña)
          </Link>
        )}
      </section>
      <section aria-labelledby="titulo-antecedentes" className="flex flex-col gap-3">
        <h2 id="titulo-antecedentes" className="text-titulo-2">
          Antecedentes del predio
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            ["Conceptos", r.antecedentes.conceptos],
            ["Reclamos anteriores", r.antecedentes.reclamosAnteriores],
            ["Pagos", r.antecedentes.pagos],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
  // El detalle va dentro del formulario para que solo se vea en el paso 1; la confirmación es otra pantalla (DIR-COB-14).
  if (r.estado === "En revisión" && r.puedeDecidir) {
    return <DecidirReclamo reclamoId={r.id} nombre={r.nombre} opciones={r.opciones} detalle={detalle} />;
  }
  return (
    <div className="flex flex-col gap-6">
      {detalle}
      <p className="inline-flex items-center gap-1 font-bold">
        <Info aria-hidden className="size-icono-pequeno" />
        {r.estado !== "En revisión"
          ? `Este reclamo ya se respondió: ${r.estado.toLowerCase()}.`
          : r.esSuyo
            ? "Es su casa: lo revisa otro miembro."
            : "Solo la directiva responde los reclamos."}
      </p>
    </div>
  );
}
