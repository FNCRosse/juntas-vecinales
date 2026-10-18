import { ChevronRight, Lightbulb, UserRoundCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { miAsistencia, proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { miDelegacion } from "@/modulos/asambleas/aplicacion/delegaciones";
import { agendaPublicada } from "@/modulos/asambleas/aplicacion/propuestas";
import { ConfirmarAsistencia } from "./ConfirmarAsistencia";

export const metadata: Metadata = { title: "Asambleas" };

// VEC-ASA-01 (HU-ASA-01) y VEC-ASA-02 (HU-ASA-02): la próxima asamblea con su quórum, la confirmación de
// asistencia y el acceso a delegar el voto (HU-ASA-06). Proponer un tema llega en HU-ASA-13.
export default async function AsambleasVecino() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const proxima = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const confirmado = sesion && proxima ? await miAsistencia(sesion, proxima.id) : false;
  const delegacion = sesion && proxima ? await miDelegacion(sesion, proxima.id) : null;
  const agenda = sesion && proxima ? await agendaPublicada(sesion, proxima.id) : [];
  const plazoAbierto = proxima ? ahora.getTime() <= new Date(proxima.confirmacionesHasta).getTime() : false;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Asambleas</h1>
      {proxima ? (
        <>
          {proxima.estado === "REPROGRAMADA" && (
            <MensajeEstado tipo="info" titulo="Asamblea reprogramada">
              <p>La directiva cambió la fecha. Confirme de nuevo su asistencia si va a poder ir.</p>
            </MensajeEstado>
          )}
          {proxima.estado === "INFORMATIVA" && (
            <MensajeEstado tipo="info" titulo="Será una sesión informativa">
              <p>En esta reunión no se votará ni se tomarán acuerdos.</p>
            </MensajeEstado>
          )}
          <section
            aria-labelledby="titulo-asamblea"
            className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <h2 id="titulo-asamblea" className="text-titulo-2">
              {proxima.titulo}
            </h2>
            <p className="font-bold">{fechaLarga(new Date(proxima.fechaHora))}</p>
            <p>{horaCorta(new Date(proxima.fechaHora))}</p>
            <p className="text-texto-secundario">{proxima.lugar}</p>
            <h3 className="pt-2 text-titulo-3">Temas a tratar</h3>
            <ol className="flex list-decimal flex-col gap-1 pl-6">
              {agenda.map((punto, i) => (
                <li key={i}>
                  {punto.titulo}
                  {punto.origen === "VECINAL" && (
                    <span className="text-pequeno text-texto-secundario"> · Propuesta de un vecino</span>
                  )}
                </li>
              ))}
            </ol>
            <div className="pt-2">
              <ConfirmarAsistencia
                asambleaId={proxima.id}
                confirmado={confirmado}
                plazoAbierto={plazoAbierto}
                plazoTexto={`${fechaEnFrase(new Date(proxima.confirmacionesHasta))} a las ${horaCorta(new Date(proxima.confirmacionesHasta))}`}
              />
            </div>
          </section>
          <section aria-labelledby="titulo-cuantos" className="flex flex-col gap-2">
            <h2 id="titulo-cuantos" className="text-titulo-2">
              ¿Cuántos van?
            </h2>
            <p>
              <span className="text-dato font-bold">
                {proxima.quorum.confirmados} de {proxima.padronTotal} casas
              </span>{" "}
              confirmaron. Se necesitan {proxima.quorumRequerido} para que la asamblea pueda decidir.
            </p>
            <BarraQuorum
              confirmados={proxima.quorum.confirmados}
              padronTotal={proxima.padronTotal}
              requerido={proxima.quorumRequerido}
              alcanza={proxima.quorum.alcanza}
              texto={proxima.quorum.texto}
            />
            <p className="text-texto-secundario">
              El quórum es el mínimo de casas presentes para que la asamblea tome acuerdos: la mitad más una.
              La línea marca ese mínimo.
            </p>
          </section>
          <section aria-labelledby="titulo-votar" className="flex flex-col gap-1">
            <h2 id="titulo-votar" className="text-titulo-2">
              Votar en la asamblea
            </h2>
            {proxima.votacion === "ABIERTA" && (
              <p>
                <strong>Votación abierta ahora.</strong> Se vota en el local de la asamblea, no en la app.
              </p>
            )}
            {proxima.votacion === "CERRADA" && (
              <p>
                Todavía no. Se abre el {fechaEnFrase(new Date(proxima.fechaHora))} a las{" "}
                {horaCorta(new Date(proxima.fechaHora))}, cuando la asamblea empiece y haya quórum.
              </p>
            )}
            {proxima.votacion === "SIN_VOTACION" && <p>Esta reunión es informativa: no habrá votaciones.</p>}
          </section>
          {proxima.estado !== "INFORMATIVA" && (
            <Link
              href="/asambleas/proponer"
              className="flex min-h-tactil items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
            >
              <Lightbulb aria-hidden className="size-icono shrink-0 text-accion-primaria" />
              <strong className="min-w-0 flex-1">Proponer un tema para la agenda</strong>
              <ChevronRight aria-hidden className="size-icono-pequeno shrink-0" />
            </Link>
          )}
          {(plazoAbierto || delegacion) && (
            <Link
              href="/asambleas/delegar"
              className="flex min-h-tactil items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
            >
              <UserRoundCheck aria-hidden className="size-icono shrink-0 text-accion-primaria" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong>¿No podrá ir? Delegar mi voto</strong>
                {delegacion && (
                  <span className="text-texto-secundario">Delegado a {delegacion.apoderadoNombre}</span>
                )}
              </span>
              <ChevronRight aria-hidden className="size-icono-pequeno shrink-0" />
            </Link>
          )}
        </>
      ) : (
        <p>No hay ninguna asamblea convocada por ahora. Le avisaremos cuando la directiva convoque una.</p>
      )}
    </div>
  );
}
