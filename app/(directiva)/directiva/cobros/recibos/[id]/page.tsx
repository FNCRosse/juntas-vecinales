import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verReciboDeLaDirectiva } from "@/modulos/aportes/aplicacion/recibos";
import { ReciboOficial } from "../ReciboOficial";

export const metadata: Metadata = { title: "Recibo oficial" };

// DIR-COB-04 (HU-COB-12): el recibo oficial de un pago aprobado, con el PDF para imprimir y entregar en la casa o para
// enviar a la app. La directiva y los mediadores lo ven; enviarlo, solo la directiva.
export default async function ReciboDeCobros({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { puedeEnviar, ...recibo } = await verReciboDeLaDirectiva(sesion, (await params).id).catch(
    (error) => {
      if (error instanceof ErrorNoEncontrado) notFound();
      throw error;
    },
  );
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Cobros
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Recibo N.° {recibo.numero}</h1>
        <p>Recibo oficial en PDF. No se puede modificar.</p>
      </div>
      <ReciboOficial recibo={recibo} puedeEnviar={puedeEnviar} />
    </div>
  );
}
