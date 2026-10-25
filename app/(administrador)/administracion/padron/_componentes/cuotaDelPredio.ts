// @HU-COB-16 @HU-GAR-10
// Lo puro de la cuota que ve el administrador al empadronar o actualizar un predio: sale de la lista de conceptos de la tarifa
// (HU-COB-16 CA1) y de las cantidades que está eligiendo, sin tocar la base de datos.
import {
  calcularCuota,
  type Concepto as ConceptoDeTarifa,
} from "@/modulos/aportes/aplicacion/calculoDeCuota";
import {
  type Concepto,
  ocupacionPorClave,
  RUBRO_DE_CONCEPTO,
} from "@/modulos/identidad/aplicacion/ocupacion";
import { soles } from "@/compartido/dinero";

export type { ConceptoDeTarifa };

/** «S/ 2.50 por semana cada uno» para cada rubro del padrón que tiene un concepto en la tarifa. */
export function preciosPorRubro(conceptos: ConceptoDeTarifa[]) {
  const precios: Partial<Record<Concepto, string>> = {};
  for (const c of conceptos) {
    const rubro = RUBRO_DE_CONCEPTO[c.clave as keyof typeof RUBRO_DE_CONCEPTO];
    if (rubro) precios[rubro] = `${soles(c.monto)} por semana cada uno`;
  }
  return precios;
}

/** La cuota semanal de esas cantidades, con su detalle: «casa S/ 2.50 + auto S/ 2.00». */
export function cuotaDeLasCantidades(conceptos: ConceptoDeTarifa[], ocupacion: Record<Concepto, number>) {
  const { lineas, total } = calcularCuota(conceptos, ocupacionPorClave(ocupacion));
  return {
    total,
    detalle: lineas
      .map((l) => `${l.nombre.charAt(0).toLowerCase()}${l.nombre.slice(1)} ${soles(l.subtotal)}`)
      .join(" + "),
  };
}

/** «lunes 28 de setiembre»: el lunes desde el que rige, para una frase («Desde el …»). */
export const lunesEnFrase = (desde: string) =>
  `${desde.charAt(0).toLowerCase()}${desde.slice(1)}`.replace(/ de \d{4}$/, "");
