import { CircleCheck, Files, Lock, MapPin, MessageSquarePlus, UserRoundCheck, Vote } from "lucide-react";
import type { Metadata } from "next";
import { OfertaDeGuia } from "@/app/_guias/OfertaDeGuia";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { Insignia } from "@/componentes/a11y/Insignia";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { FilaEnlace, Tarjeta } from "@/componentes/a11y/Tarjeta";
import { guiaDeSeccion } from "@/modulos/accesibilidad/aplicacion/guias";
import { miAsistencia, proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { miDelegacion } from "@/modulos/asambleas/aplicacion/delegaciones";
import { agendaPublicada } from "@/modulos/asambleas/aplicacion/propuestas";
import { ConfirmarAsistencia } from "./ConfirmarAsistencia";

export const metadata: Metadata = { title: "Asambleas" };

type Votacion = "ABIERTA" | "CERRADA" | "SIN_VOTACION";

/** "Votar en la asamblea": se vota en el local, así que aquí solo se dice si ya está abierta (VEC-ASA-01). */
function EstadoDeVotacion({ votacion, cuando }: { votacion: Votacion; cuando: Date }) {
  if (votacion === "ABIERTA")
    return (
      <div className="flex min-h-16 items-center gap-3 rounded-tarjeta border-(length:--borde-ancho-control) border-borde-fuerte bg-fondo-superficie px-4 py-2 shadow-tarjeta senior:px-6">
        <Vote aria-hidden className="size-icono shrink-0 text-accion-primaria" />
        <span className="flex flex-col gap-1">
          <strong>Votar en la asamblea</strong>
          <Insignia tono="exito" icono={CircleCheck}>
            Votación abierta ahora
          </Insignia>
          <span className="text-pequeno">Se vota en el local de la asamblea, no en la app.</span>
        </span>
      </div>
    );
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-tarjeta border-(length:--borde-ancho-control) border-dashed border-borde-control bg-fondo-deshabilitado px-4 py-2 text-texto-deshabilitado senior:px-6">
      <Lock aria-hidden className="size-icono shrink-0" />
      <span className="flex flex-col">
        <strong>Votar en la asamblea</strong>
        <span className="text-pequeno">
          {votacion === "CERRADA"
            ? `Todavía no. Se abre el ${fechaEnFrase(cuando)} a las ${horaCorta(cuando)}, cuando la asamblea empiece y haya quórum.`
            : "Esta reunión es informativa: no habrá votaciones."}
        </span>
      </span>
    </div>
  );
}

// VEC-ASA-01 (HU-ASA-01) y VEC-ASA-02 (HU-ASA-02): la próxima asamblea con su quórum, la confirmación de
// asistencia, delegar el voto (HU-ASA-06), proponer un tema (HU-ASA-13) y las actas anteriores.
export default async function AsambleasVecino() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const proxima = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const confirmado = sesion && proxima ? await miAsistencia(sesion, proxima.id) : false;
  const delegacion = sesion && proxima ? await miDelegacion(sesion, proxima.id) : null;
  const agenda = sesion && proxima ? await agendaPublicada(sesion, proxima.id) : [];
  const guia = sesion ? await guiaDeSeccion(sesion.usuarioId, "ASAMBLEAS") : null;
  const plazoAbierto = proxima ? ahora.getTime() <= new Date(proxima.confirmacionesHasta).getTime() : false;
  const cuando = proxima ? new Date(proxima.fechaHora) : null;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Asambleas</h1>
      {guia?.ofrecer && (
        <div data-ancho="completo">
          <OfertaDeGuia seccion="ASAMBLEAS" enPausa={guia.estado === "PAUSADA"} paso={guia.paso} />
        </div>
      )}
      {proxima && cuando ? (
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
            className="flex flex-col gap-3 rounded-tarjeta border-(length:--borde-ancho-control) border-borde-fuerte bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <h2 id="titulo-asamblea" className="text-base text-texto-secundario">
              {proxima.titulo}
            </h2>
            <p className="flex flex-col">
              <span className="text-dato font-bold leading-titulo">
                {fechaLarga(cuando, { conAnio: false })}
              </span>
              <span className="text-titulo-3 font-bold">{horaCorta(cuando)}</span>
            </p>
            <p className="flex gap-2 text-titulo-3 font-bold leading-titulo">
              <MapPin aria-hidden className="size-icono shrink-0 text-accion-primaria" />
              {proxima.lugar}
            </p>
            {agenda.length > 0 && (
              <div className="flex flex-col gap-1">
                <h3 className="text-base">Temas a tratar</h3>
                <ol className="flex flex-col gap-1">
                  {agenda.map((punto, i) => (
                    <li key={i}>
                      {i + 1}. {punto.titulo}
                      {punto.origen === "VECINAL" && (
                        <span className="text-pequeno text-texto-secundario"> · Propuesta de un vecino</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <ConfirmarAsistencia
              asambleaId={proxima.id}
              confirmado={confirmado}
              plazoAbierto={plazoAbierto}
              plazoTexto={`el ${fechaEnFrase(new Date(proxima.confirmacionesHasta))} a las ${horaCorta(new Date(proxima.confirmacionesHasta))}`}
            />
          </section>
          <Tarjeta titulo="¿Cuántos van?">
            <p aria-live="polite">
              <strong>
                {proxima.quorum.confirmados} de {proxima.padronTotal} casas
              </strong>{" "}
              confirmaron. Se necesitan <strong>{proxima.quorumRequerido}</strong> para que la asamblea pueda
              decidir.
            </p>
            <BarraQuorum
              confirmados={proxima.quorum.confirmados}
              padronTotal={proxima.padronTotal}
              requerido={proxima.quorumRequerido}
              alcanza={proxima.quorum.alcanza}
            />
            <p className="text-pequeno text-texto-secundario">
              <strong>Quórum</strong> es el mínimo de casas presentes para que la asamblea tome acuerdos: la
              mitad más una. La línea marca ese mínimo.
            </p>
          </Tarjeta>
          <div className="flex flex-col gap-separacion">
            {(plazoAbierto || delegacion) && (
              <FilaEnlace
                href="/asambleas/delegar"
                icono={UserRoundCheck}
                titulo="¿No podrá ir? Delegar mi voto"
                detalle={
                  delegacion && (
                    <span className="text-pequeno font-bold text-texto-exito">
                      Delegado a {delegacion.apoderadoNombre}
                    </span>
                  )
                }
              />
            )}
            {proxima.estado !== "INFORMATIVA" && (
              <FilaEnlace
                href="/asambleas/proponer"
                icono={MessageSquarePlus}
                titulo="Proponer un tema para la agenda"
              />
            )}
            <EstadoDeVotacion votacion={proxima.votacion} cuando={cuando} />
            <FilaEnlace href="/transparencia" icono={Files} titulo="Actas de asambleas anteriores" />
          </div>
        </>
      ) : (
        <>
          <p>No hay ninguna asamblea convocada por ahora. Le avisaremos cuando la directiva convoque una.</p>
          <FilaEnlace href="/transparencia" icono={Files} titulo="Actas de asambleas anteriores" />
        </>
      )}
    </div>
  );
}
