import { ChevronLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import { verTarifa } from "@/modulos/aportes/aplicacion/tarifa";

export const metadata: Metadata = { title: "Tarifa de la cuota semanal" };

// DIR-COB-20 y DIR-COB-21 (HU-COB-16 CA1 y CA3): la tarifa vigente con sus conceptos, lo que ya está programado y el
// historial de solo lectura. Solo la directiva ve «Cambiar»; el mediador la ve sin poder editarla.
export default async function Tarifa() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const tarifa = await verTarifa(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/mas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a más opciones
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Tarifa de la cuota semanal</h1>
        {tarifa.vigente ? (
          <p>
            Vigente desde el {tarifa.vigente.desde} · aprobada en {tarifa.vigente.aprobadaEn}
          </p>
        ) : (
          <p>Todavía no hay una tarifa registrada. La directiva agrega el primer concepto.</p>
        )}
      </div>
      {tarifa.programados.map((p) => (
        <MensajeEstado key={p.id} tipo="info" titulo="Cambio programado">
          <p>
            {p.texto} desde el {p.desde}. Avisamos a las casas que lo pagan. Las cuotas ya emitidas no
            cambian.
          </p>
        </MensajeEstado>
      ))}
      {tarifa.vigente && (
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Conceptos de la cuota semanal y su monto</caption>
          <thead>
            <tr className="border-b border-borde-sutil">
              <th scope="col" className="py-2 pr-2 font-bold">
                Concepto
              </th>
              <th scope="col" className="py-2 pr-2 font-bold">
                Se cobra
              </th>
              <th scope="col" className="py-2 text-right font-bold">
                Monto por semana
              </th>
            </tr>
          </thead>
          <tbody>
            {tarifa.vigente.conceptos.map((c) => (
              <tr key={c.clave} className="border-b border-borde-sutil">
                <th scope="row" className="py-3 pr-2 font-bold">
                  {c.nombre}
                </th>
                <td className="py-3 pr-2">{c.unidadTexto}</td>
                <td className="py-3 text-right font-bold">{soles(c.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tarifa.puedeCambiar ? (
        <BotonEnlace href="/directiva/cobros/tarifa/cambiar" icono={Pencil}>
          {tarifa.vigente ? "Cambiar un monto o agregar un concepto" : "Agregar el primer concepto"}
        </BotonEnlace>
      ) : (
        <p className="text-texto-secundario">Solo la directiva cambia la tarifa. Usted puede verla.</p>
      )}
      <section aria-labelledby="titulo-historial" className="flex flex-col gap-4">
        <h2 id="titulo-historial" className="text-titulo-2">
          Historial de cambios (solo lectura)
        </h2>
        {tarifa.historial.length > 0 ? (
          <ListaVerMas
            etiqueta="Historial de cambios de la tarifa"
            normal={4}
            senior={3}
            elementos={tarifa.historial.map((h) => (
              <article
                key={h.id}
                className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <h3 className="text-titulo-3">{h.texto}</h3>
                <p>{h.rige}</p>
                <p className="text-pequeno text-texto-secundario">
                  {h.responsable} · {h.acta}
                </p>
              </article>
            ))}
          />
        ) : (
          <p>Todavía no hay cambios.</p>
        )}
      </section>
    </div>
  );
}
