// @HU-COB-16 @HU-GAR-10
import { soles } from "@/compartido/dinero";
import type { Concepto } from "@/modulos/identidad/aplicacion/ocupacion";
import { type ConceptoDeTarifa, cuotaDeLasCantidades, lunesEnFrase } from "./cuotaDelPredio";

/**
 * La cuota semanal que resultan de las cantidades que se están eligiendo (prototipo ADM-PAD-03 y ADM-PAD-08, HU-COB-01 CA1):
 * al actualizar, lo que paga hoy y lo que pagará desde el siguiente ciclo; al empadronar, la que se calcula y desde cuándo se
 * cobra. Se calcula con la lista de la tarifa vigente, la misma que aprobó la directiva.
 */
export function CuotaSemanal({
  conceptos,
  ocupacion,
  desde,
  hoy,
}: {
  conceptos: ConceptoDeTarifa[];
  ocupacion: Record<Concepto, number>;
  /** «Lunes 28 de setiembre de 2026». */
  desde: string;
  /** Lo que paga hoy; `null` si todavía no tiene cuota; sin este dato, se está empadronando una vivienda. */
  hoy?: number | null;
}) {
  const { total, detalle } = cuotaDeLasCantidades(conceptos, ocupacion);
  const actualizando = hoy !== undefined;
  return (
    <section
      aria-labelledby="titulo-cuota-semanal"
      className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6"
    >
      <h2 id="titulo-cuota-semanal" className="text-titulo-3">
        {actualizando ? "Cuota semanal" : "Cuota semanal calculada"}
      </h2>
      {actualizando && hoy !== null && (
        <p>
          <span className="text-texto-secundario">Hoy: </span>
          <strong>{soles(hoy)}</strong>
        </p>
      )}
      <p>
        {actualizando && <span className="text-texto-secundario">Desde el {lunesEnFrase(desde)}: </span>}
        <strong className="text-titulo-2">{soles(total)}</strong>
      </p>
      {detalle && <p className="text-texto-secundario">{detalle}</p>}
      <p className="text-pequeno text-texto-secundario">
        {actualizando
          ? "Se recalcula sola con la tarifa vigente, desde el siguiente ciclo de cobro."
          : `Con la tarifa vigente. Empieza a cobrarse el ${lunesEnFrase(desde)} de ${desde.slice(-4)}.`}
      </p>
    </section>
  );
}
