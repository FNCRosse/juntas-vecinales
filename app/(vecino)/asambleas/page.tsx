import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { miAsistencia, proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { ConfirmarAsistencia } from "./ConfirmarAsistencia";

export const metadata: Metadata = { title: "Asambleas" };

// VEC-ASA-01 (HU-ASA-01) y VEC-ASA-02 (HU-ASA-02): la próxima asamblea con su quórum y la confirmación de
// asistencia. Delegar el voto llega en HU-ASA-06; proponer un tema, en HU-ASA-13.
export default async function AsambleasVecino() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const proxima = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const confirmado = sesion && proxima ? await miAsistencia(sesion, proxima.id) : false;
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
            <p className="pt-2 font-bold">Motivo</p>
            <p>{proxima.motivo}</p>
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
        </>
      ) : (
        <p>No hay ninguna asamblea convocada por ahora. Le avisaremos cuando la directiva convoque una.</p>
      )}
    </div>
  );
}
