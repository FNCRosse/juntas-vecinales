import { ChevronRight, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { Volver } from "@/componentes/a11y/Volver";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaYHora } from "@/compartido/fechas";
import { verComunicado } from "@/modulos/transparencia/aplicacion/comunicados";
import { InsigniasDeComunicado } from "../_componentes/InsigniasDeComunicado";

export const metadata: Metadata = { title: "Comunicado" };

const ENLACE = "inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace";

// DIR-ASA-14 (HU-ASA-15): un comunicado como lo leen los vecinos. No se edita ni se borra (docs/DATOS.md §3): si tiene un
// error se publica una corrección, que lo reemplaza en las noticias y avisa otra vez a cada vecino.
export default async function Comunicado({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const comunicado = await verComunicado(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/directiva/comunicados">Volver a comunicados</Volver>
      <div className="flex flex-col gap-2">
        <p className="text-pequeno font-bold text-texto-secundario">
          {fechaYHora(new Date(comunicado.fecha))} · Publicado por {comunicado.autor}
        </p>
        <h1 className="text-titulo-1">{comunicado.titulo}</h1>
        <InsigniasDeComunicado comunicado={comunicado} />
      </div>
      <Tarjeta titulo="Mensaje">
        <p className="whitespace-pre-line">{comunicado.cuerpo}</p>
      </Tarjeta>
      <div className="flex flex-col gap-3">
        {comunicado.corregidoPorId ? (
          <MensajeEstado tipo="info" titulo="Este comunicado se corrigió">
            <p>Los vecinos ya no lo ven en sus noticias: ven la corrección.</p>
            <Link href={`/directiva/comunicados/${comunicado.corregidoPorId}`} className={ENLACE}>
              Ver la corrección
              <ChevronRight aria-hidden className="size-icono shrink-0" />
            </Link>
          </MensajeEstado>
        ) : (
          <>
            <p className="text-texto-secundario">
              Un comunicado publicado no se cambia ni se borra. Si tiene un error, publique una corrección.
              Los vecinos verán la corrección en lugar de este y les llegará un aviso.
            </p>
            <BotonEnlace
              href={`/directiva/comunicados/nuevo?corrige=${comunicado.id}`}
              variante="secundario"
              icono={PencilLine}
              anchoCompleto
            >
              Publicar una corrección
            </BotonEnlace>
          </>
        )}
        {comunicado.corrigeAId && (
          <Link href={`/directiva/comunicados/${comunicado.corrigeAId}`} className={ENLACE}>
            Ver el comunicado que corrige
            <ChevronRight aria-hidden className="size-icono shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
