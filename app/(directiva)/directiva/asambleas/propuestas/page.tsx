import { ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { fechaEnFrase, fechaYHora } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { bandejaDePropuestas } from "@/modulos/asambleas/aplicacion/propuestas";

export const metadata: Metadata = { title: "Propuestas para la agenda" };

const ESTADOS = {
  PENDIENTE_REVISION: "Pendiente de revisión",
  INCLUIDA: "Incluida en la agenda",
  NO_INCLUIDA: "No incluida",
} as const;

// DIR-ASA-05 (HU-ASA-13 CA2): las propuestas que enviaron los vecinos, por fecha de envío. Decidir cuáles se
// incluyen llega con HU-ASA-14.
export default async function Propuestas() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const asamblea = await proximaAsamblea(sesion);
  const propuestas = asamblea ? await bandejaDePropuestas(sesion, asamblea.id) : [];
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
          Ordenadas por fecha de envío
          {asamblea ? ` para la asamblea del ${fechaEnFrase(new Date(asamblea.fechaHora))}.` : "."}
        </p>
      </div>
      {propuestas.length > 0 ? (
        <ListaVerMas
          etiqueta="Propuestas"
          elementos={propuestas.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <p className="text-pequeno text-texto-secundario">
                {fechaYHora(new Date(p.enviadaEn))} · {p.quien}, {p.vivienda}
              </p>
              <h2 className="text-titulo-3">{p.titulo}</h2>
              <p>{p.justificacion}</p>
              <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                <Info aria-hidden className="size-icono-pequeno" />
                {ESTADOS[p.estado]}
              </span>
            </article>
          ))}
        />
      ) : (
        <p>Todavía no hay propuestas de los vecinos para esta asamblea.</p>
      )}
    </div>
  );
}
