"use client";
// @HU-GAR-07

import { Check, TriangleAlert, Users, X } from "lucide-react";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

type Visita = {
  id: string;
  nombre: string;
  dni: string | null;
  motivo: string | null;
  vehiculo: string;
  llegoA: string;
  anotadaPor: string;
  estado: string;
};

const YA_RESPONDIDA: Record<string, string> = {
  AUTORIZADA: "La garita ya sabe que puede pasar.",
  LLEGO: "Ya entró.",
  NO_AUTORIZADA: "La garita ya sabe que no puede pasar.",
  NO_ENTRO: "No entró.",
};

export function ResponderVisita({ visita }: { visita: Visita }) {
  const [enviando, setEnviando] = useState<boolean | null>(null);
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const [falla, setFalla] = useState<string | null>(null);

  async function responder(autoriza: boolean) {
    setEnviando(autoriza);
    setFalla(null);
    const r = await enviarJson(`/api/garita/visitas/${visita.id}`, "PATCH", { autoriza, via: "app" });
    setEnviando(null);
    if (r.ok) setRespuesta(autoriza);
    else setFalla(r.error);
  }

  const yaRespondida = YA_RESPONDIDA[visita.estado];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">¿Deja pasar a {visita.nombre}?</h1>
      <section className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
        <span className="inline-flex items-center gap-2 font-bold">
          <TriangleAlert aria-hidden className="size-icono shrink-0 text-texto-aviso" />
          No estaba anunciada
        </span>
        <strong>{visita.dni ? `${visita.nombre} · ${visita.dni}` : visita.nombre}</strong>
        <span>
          {visita.motivo ? `Dice que viene a: ${visita.motivo}.` : ""} Llegó {visita.vehiculo.toLowerCase()},
          hoy a las {visita.llegoA}.
        </span>
        <span className="text-texto-secundario">Registró: {visita.anotadaPor}, vigilante</span>
      </section>

      {respuesta !== null ? (
        <MensajeEstado
          tipo={respuesta ? "exito" : "info"}
          titulo={
            respuesta ? `Avisamos a la garita: ${visita.nombre} puede pasar` : "Avisamos a la garita: no pasa"
          }
        >
          <p>El vigilante ya ve su respuesta.</p>
        </MensajeEstado>
      ) : yaRespondida ? (
        <MensajeEstado tipo="info" titulo="Esta visita ya tiene respuesta">
          <p>{yaRespondida}</p>
        </MensajeEstado>
      ) : (
        <div className="flex flex-col gap-separacion">
          <Boton icono={Check} cargando={enviando === true} onClick={() => responder(true)}>
            Sí, dejarla pasar
          </Boton>
          <Boton
            variante="secundario"
            icono={X}
            cargando={enviando === false}
            onClick={() => responder(false)}
          >
            No la conozco, que no pase
          </Boton>
          <p>Si prefiere, llame a la garita y dígale al vigilante qué hacer.</p>
        </div>
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió su respuesta">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <BotonEnlace href="/visitas" variante="secundario" icono={Users}>
        Ir a Mis visitas
      </BotonEnlace>
    </div>
  );
}
