import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { RegistrarAsistencia } from "./RegistrarAsistencia";

export const metadata: Metadata = { title: "Registrar asistencia" };

// DIR-ASA-06 (HU-ASA-03): el mediador asienta la confirmación de un vecino que no usa la app.
export default async function RegistrarAsistenciaPagina() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const proxima = await proximaAsamblea(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Como mediador</p>
        <h1 className="text-titulo-1">Registrar la asistencia de un vecino</h1>
        <p>Para vecinos que le confirmaron en persona o por teléfono.</p>
      </div>
      {proxima ? (
        <>
          <RegistrarAsistencia asambleaId={proxima.id} />
          <section aria-labelledby="titulo-quorum" className="flex flex-col gap-1">
            <h2 id="titulo-quorum" className="text-titulo-2">
              Quórum proyectado
            </h2>
            <p className="text-dato font-bold">
              {proxima.confirmados.total} de {proxima.padronTotal} casas
            </p>
          </section>
        </>
      ) : (
        <p>No hay ninguna asamblea convocada. Convoque una para poder registrar asistencias.</p>
      )}
    </div>
  );
}
