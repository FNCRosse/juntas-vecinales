import { ChevronLeft, Pencil, UserMinus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";
import { fechaYHora, primerNombre } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { BotonReenviar } from "./_componentes/BotonReenviar";

export const metadata: Metadata = { title: "Ficha de la vivienda" };

// ADM-PAD-02 Ficha de la vivienda: residentes con el reenvío del enlace (HU-GAR-11), datos del
// predio, actualizar (HU-GAR-10), dar de baja (HU-GAR-09) y el historial de solo lectura.
export default async function FichaVivienda({
  params,
  searchParams,
}: {
  params: Promise<{ predioId: string }>;
  searchParams: Promise<{ aviso?: string; nombre?: string }>;
}) {
  const { aviso, nombre } = await searchParams;
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const vivienda = await verVivienda(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/padron"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al padrón
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Ficha de vivienda</p>
        <h1 className="text-titulo-1">{vivienda.direccion}</h1>
        <p>Titular: {vivienda.titular}</p>
      </div>
      {aviso === "actualizado" && (
        <MensajeEstado tipo="exito" titulo="Datos guardados">
          <p>El cambio quedó en el historial de la vivienda.</p>
        </MensajeEstado>
      )}
      {aviso === "baja" && nombre && (
        <MensajeEstado tipo="exito" titulo={`Dimos de baja a ${nombre}`}>
          <p>Cerramos su sesión, salió de la lista de la garita y le enviamos la confirmación.</p>
          <p>Si ya no hay inquilino, actualice los datos del predio.</p>
        </MensajeEstado>
      )}

      <Tarjeta titulo="Quiénes viven aquí">
        <ul className="flex flex-col gap-3">
          {vivienda.residentes.map((r) => (
            <li
              key={r.usuarioId}
              className="flex flex-col gap-1 border-b border-borde-sutil pb-3 last:border-b-0"
            >
              <strong>{r.nombre}</strong>
              <span>
                {r.relacion} · DNI {r.dni}
              </span>
              <span className="text-texto-secundario">
                {r.whatsapp
                  ? `WhatsApp ${r.whatsapp}`
                  : "Sin cuenta propia: los avisos le llegan a la persona titular"}
              </span>
              {r.whatsapp && <BotonReenviar usuarioId={r.usuarioId} nombre={primerNombre(r.nombre)} />}
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta titulo="Datos del predio">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">Uso</dt>
            <dd className="font-bold">{vivienda.uso}</dd>
          </div>
          {vivienda.conceptos.map(({ concepto, cantidad }) => (
            <div key={concepto} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{concepto}</dt>
              <dd className="font-bold">{cantidad}</dd>
            </div>
          ))}
        </dl>
      </Tarjeta>

      <div className="flex flex-col gap-separacion md:flex-row">
        <BotonEnlace
          href={`/administracion/padron/${vivienda.id}/actualizar`}
          variante="secundario"
          icono={Pencil}
        >
          Actualizar los datos del predio
        </BotonEnlace>
        {vivienda.residentes.length > 0 && (
          <BotonEnlace
            href={`/administracion/padron/${vivienda.id}/baja`}
            variante="secundario"
            icono={UserMinus}
          >
            Dar de baja a un residente
          </BotonEnlace>
        )}
      </div>

      <Tarjeta titulo="Historial de cambios (solo lectura)">
        <ul className="flex flex-col gap-3">
          {vivienda.historial.map((h) => (
            <li key={h.id} className="flex flex-col border-b border-borde-sutil pb-3 last:border-b-0">
              <span className="text-pequeno text-texto-secundario">
                {fechaYHora(new Date(h.fecha))} · {h.actor}
              </span>
              <strong>{h.texto}</strong>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}
