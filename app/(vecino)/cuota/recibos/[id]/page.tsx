import { ChevronLeft, CircleCheck, FileDown, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace, clasesBoton } from "@/componentes/a11y/Boton";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verMiRecibo } from "@/modulos/aportes/aplicacion/recibos";
import { ConfirmarRecibo } from "./ConfirmarRecibo";

export const metadata: Metadata = { title: "Recibo" };

// VEC-COB-06 (HU-COB-12): el recibo oficial de la casa, con su PDF, la vista para imprimir y el botón para confirmar que
// lo recibió. Solo de su casa y solo cuando la directiva se lo envió (404 si no, AC-7).
export default async function Recibo({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const r = await verMiRecibo(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cuota/pagos"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mis pagos
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Recibo N.° {r.numero}</h1>
        <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
          <CircleCheck aria-hidden className="size-icono-pequeno" />
          Aprobado
        </span>
        <p className="text-titulo-2">{soles(r.monto)}</p>
      </div>
      <dl className="flex flex-col gap-3">
        {[
          ["Fecha", r.fecha],
          ["Vivienda", `${r.vivienda} · ${r.titular}`],
          ["Concepto", r.concepto],
          ["Recibió", r.registradoPor],
          ["Código para verificarlo", r.codigo],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
            <dd className="font-bold">{valor}</dd>
          </div>
        ))}
      </dl>
      <p>
        Este recibo digital vale igual que el de papel. Si prefiere el de papel, la directiva se lo lleva a su
        casa.
      </p>
      {r.puedeConfirmar ? (
        <ConfirmarRecibo reciboId={r.id} />
      ) : (
        <p className="font-bold">Usted confirmó que lo recibió.</p>
      )}
      <div className="flex flex-col gap-opuestas">
        <a href={`/api/aportes/recibos/${r.id}/pdf?descargar=1`} className={clasesBoton("secundario", true)}>
          <FileDown aria-hidden className="size-icono shrink-0" />
          <span>Descargar recibo (PDF)</span>
        </a>
        <a
          href={`/api/aportes/recibos/${r.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className={clasesBoton("secundario", true)}
        >
          <Printer aria-hidden className="size-icono shrink-0" />
          <span>
            Ver para imprimir<span className="sr-only"> (se abre en otra pestaña)</span>
          </span>
        </a>
        {r.puedePedirEnPapel && (
          <BotonEnlace href={`/cuota/recibo-en-papel?recibo=${r.id}`} variante="secundario">
            Pedir este recibo en papel
          </BotonEnlace>
        )}
      </div>
    </div>
  );
}
