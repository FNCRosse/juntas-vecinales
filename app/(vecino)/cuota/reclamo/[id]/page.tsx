import { FileDown, Info, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verMiReclamo } from "@/modulos/aportes/aplicacion/reclamos";

export const metadata: Metadata = { title: "Su reclamo" };

const TITULOS: Record<string, string> = {
  "En revisión": "Su reclamo está en revisión",
  Aprobado: "Su reclamo fue aprobado",
  "Se mantiene su cuota": "La directiva revisó su reclamo",
};

// VEC-COB-10 (HU-COB-03 CA2): el reclamo enviado, en revisión, con su constancia. Se llega a él al enviarlo (con «enviado») y
// desde «Ya tiene un reclamo en revisión». Solo de su casa: otra casa recibe 404 (AC-7).
export default async function MiReclamo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enviado?: string }>;
}) {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const reclamo = await verMiReclamo(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const { enviado } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      {enviado && (
        <MensajeEstado tipo="exito" titulo={`Enviado el ${reclamo.enviado}`}>
          <p>Avisamos a la directiva.</p>
        </MensajeEstado>
      )}
      <h1 className="text-titulo-1">{TITULOS[reclamo.estado] ?? "Su reclamo"}</h1>
      <section
        aria-label="Su reclamo"
        className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      >
        <p className="text-pequeno text-texto-secundario">Reclamo N.° {reclamo.numero}</p>
        <p className="font-bold">{reclamo.motivo}</p>
        {reclamo.detalle && <p>{reclamo.detalle}</p>}
        <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
          <Info aria-hidden className="size-icono-pequeno" />
          {reclamo.estado}
        </span>
      </section>
      {reclamo.respuesta && (
        <section aria-label="Respuesta de la directiva" className="flex flex-col gap-2">
          <h2 className="text-titulo-2">Lo que respondió la directiva</h2>
          <p>{reclamo.respuesta}</p>
        </section>
      )}
      {reclamo.estado === "En revisión" && (
        <p>
          Su cuota figura como en reclamo hasta que la directiva responda. Le avisaremos aquí si la ajustan o
          si se mantiene, y por qué.
        </p>
      )}
      <div className="flex flex-col gap-opuestas">
        <BotonEnlace
          href={`/api/aportes/ajustes/${reclamo.id}/constancia`}
          variante="secundario"
          icono={FileDown}
        >
          Descargar constancia (PDF)
        </BotonEnlace>
        <BotonEnlace href="/cuota" icono={Wallet}>
          Volver a Mi cuota
        </BotonEnlace>
      </div>
    </div>
  );
}
