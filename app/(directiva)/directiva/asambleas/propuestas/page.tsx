import { ChevronLeft, CircleCheck, Info, ListChecks, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { fechaEnFrase, fechaYHora } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { agendaPublicada, bandejaDePropuestas } from "@/modulos/asambleas/aplicacion/propuestas";
import { DecidirPropuesta } from "./DecidirPropuesta";

export const metadata: Metadata = { title: "Propuestas para la agenda" };

const INSIGNIAS = {
  PENDIENTE_REVISION: {
    clases: "border-borde-info bg-fondo-info text-texto-info",
    Icono: Info,
    texto: () => "Por revisar",
  },
  INCLUIDA: {
    clases: "border-borde-exito bg-fondo-exito text-texto-exito",
    Icono: CircleCheck,
    texto: () => "Incluida en la agenda",
  },
  NO_INCLUIDA: {
    clases: "border-borde-aviso bg-fondo-aviso text-texto-aviso",
    Icono: TriangleAlert,
    texto: (motivo: string | null) => `No incluida: ${motivo ?? ""}`,
  },
} as const;

// DIR-ASA-05 (HU-ASA-13 CA2, HU-ASA-14): las propuestas de los vecinos por fecha de envío, para decidir cuáles
// se incluyen, y la agenda publicada a la que se anexan solas.
export default async function Propuestas() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const asamblea = await proximaAsamblea(sesion);
  const [propuestas, agenda] = asamblea
    ? await Promise.all([bandejaDePropuestas(sesion, asamblea.id), agendaPublicada(sesion, asamblea.id)])
    : [[], []];
  const fecha = asamblea ? fechaEnFrase(new Date(asamblea.fechaHora)) : "";
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
        <h1 className="text-titulo-1">Propuestas para la agenda</h1>
        <p>
          Ordenadas por fecha de envío.
          {asamblea
            ? ` Las que incluya se agregan solas a la agenda publicada de la asamblea del ${fecha}.`
            : ""}
        </p>
      </div>
      {propuestas.length > 0 ? (
        <ListaVerMas
          etiqueta="Propuestas"
          elementos={propuestas.map((p) => {
            const insignia = INSIGNIAS[p.estado];
            return (
              <article
                key={p.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <p className="text-pequeno text-texto-secundario">
                  {fechaYHora(new Date(p.enviadaEn))} · {p.quien}, {p.vivienda}
                </p>
                <h2 className="text-titulo-3">{p.titulo}</h2>
                <p>{p.justificacion}</p>
                <span
                  className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${insignia.clases}`}
                >
                  <insignia.Icono aria-hidden className="size-icono-pequeno" />
                  {insignia.texto(p.motivoDecision)}
                </span>
                <DecidirPropuesta
                  propuestaId={p.id}
                  titulo={p.titulo}
                  decidida={p.estado !== "PENDIENTE_REVISION"}
                />
              </article>
            );
          })}
        />
      ) : (
        <p>Todavía no hay propuestas de los vecinos para esta asamblea.</p>
      )}
      {asamblea && (
        <section aria-labelledby="titulo-agenda" className="flex flex-col gap-3">
          <h2 id="titulo-agenda" className="flex items-center gap-2 text-titulo-2">
            <ListChecks aria-hidden className="size-icono text-accion-primaria" />
            Agenda publicada
          </h2>
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            {agenda.map((punto, i) => (
              <li key={i}>
                <strong>{punto.titulo}</strong>
                <br />
                <span className="text-pequeno text-texto-secundario">
                  {punto.origen === "DIRECTIVA"
                    ? "Punto de la directiva"
                    : `Propuesta vecinal de ${punto.quien ?? ""}`}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
