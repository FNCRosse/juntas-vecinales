import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";

export const metadata: Metadata = { title: "Asambleas" };

// VEC-ASA-01 (HU-ASA-01): la próxima asamblea con su quórum. Confirmar asistencia llega en HU-ASA-02;
// delegar el voto, en HU-ASA-06; proponer un tema, en HU-ASA-13.
export default async function AsambleasVecino() {
  const sesion = await sesionActual();
  const proxima = sesion ? await proximaAsamblea(sesion) : null;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Asambleas</h1>
      {proxima ? (
        <>
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
            <p className="pt-2 text-texto-secundario">
              Puede confirmar su asistencia hasta {fechaEnFrase(new Date(proxima.confirmacionesHasta))} a las{" "}
              {horaCorta(new Date(proxima.confirmacionesHasta))}.
            </p>
          </section>
          <section aria-labelledby="titulo-cuantos" className="flex flex-col gap-2">
            <h2 id="titulo-cuantos" className="text-titulo-2">
              ¿Cuántos van?
            </h2>
            <p>
              <span className="text-dato font-bold">
                {proxima.confirmados.total} de {proxima.padronTotal} casas
              </span>{" "}
              confirmaron. Se necesitan {proxima.quorumRequerido} para que la asamblea pueda decidir.
            </p>
            <p className="text-texto-secundario">
              El quórum es el mínimo de casas presentes para que la asamblea tome acuerdos: la mitad más una.
            </p>
          </section>
        </>
      ) : (
        <p>No hay ninguna asamblea convocada por ahora. Le avisaremos cuando la directiva convoque una.</p>
      )}
    </div>
  );
}
