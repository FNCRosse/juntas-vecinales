import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvanceReporte } from "@/app/_incidentes/AvanceReporte";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verMiQueja } from "@/modulos/incidencias/aplicacion/seguimiento";

export const metadata: Metadata = { title: "Avance de mi reporte" };

// VEC-QUE-08 (HU-QUE-09): el avance de uno de sus reportes; el de otra persona no existe (AC-7).
export default async function AvanceDeMiReporte({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const avance = await verMiQueja(sesion, (await params).id).catch((e) => {
    if (e instanceof ErrorNoEncontrado) notFound();
    throw e;
  });
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/incidentes"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver a Incidentes
      </Link>
      <AvanceReporte avance={avance} hrefOficio={`/api/quejas/${avance.id}/oficio`} />
    </div>
  );
}
