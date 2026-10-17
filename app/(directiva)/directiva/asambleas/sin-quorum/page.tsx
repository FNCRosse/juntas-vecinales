import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { fechaEnFrase, horaCorta } from "@/compartido/fechas";
import { casoSinQuorum } from "@/modulos/asambleas/aplicacion/contingencia";
import { DecidirSinQuorum } from "./DecidirSinQuorum";

export const metadata: Metadata = { title: "Sin quórum" };

// DIR-ASA-07 y DIR-ASA-08 (HU-ASA-05): qué hacer con una asamblea que no llegó al quórum, en dos pasos.
export default async function SinQuorum() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const caso = await casoSinQuorum(sesion);
  if (!caso) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Sin quórum</h1>
        <p>Por ahora no hay ninguna asamblea que haya cerrado sin llegar al quórum.</p>
        <BotonEnlace href="/directiva/asambleas" icono={CalendarDays}>
          Volver a asambleas
        </BotonEnlace>
      </div>
    );
  }
  const corte = new Date(caso.confirmacionesHasta);
  return (
    <DecidirSinQuorum
      asambleaId={caso.id}
      titulo={caso.titulo}
      cuando={fechaEnFrase(new Date(caso.fechaHora)).replace(/ de \d{4}$/, "")}
      corte={`${fechaEnFrase(corte)} a las ${horaCorta(corte)}`}
      confirmados={caso.quorum.confirmados}
      padronTotal={caso.padronTotal}
      requerido={caso.quorumRequerido}
      faltan={caso.quorum.faltan}
    />
  );
}
