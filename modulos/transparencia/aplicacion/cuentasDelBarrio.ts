// @HU-COB-14
import { generarPdf } from "@/compartido/archivos/pdf";
import { soles } from "@/compartido/dinero";
import { fechaCorta, horaCorta } from "@/compartido/fechas";
import { totalesDelBarrio } from "@/modulos/aportes/aplicacion/tablero";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { garantizarNoIdentificacion, rangoDelMes } from "@/modulos/transparencia/dominio/caja";
import { etiquetaDelMes, mesElegido, mesesQueSeOfrecen, rendicionPublicadaDe } from "./caja";

/**
 * El balance agregado de la recaudación (HU-COB-14, VEC-TRA-01): lo que se juntó en el mes, lo que falta cobrar y lo que se juntó
 * cada semana, y —cuando la directiva publicó la rendición del mes— en qué se gastó, solo por concepto. Lo ve todo vecino con
 * sesión. Son totales del barrio: no trae nada de una casa ni de una persona, y `garantizarNoIdentificacion` lo comprueba antes de
 * entregarlo (CA2). Se calcula en cada consulta, así que cambia con cada pago que la directiva valida (CA3).
 */
export async function cuentasDelBarrio(sesion: SesionDto, mesPedido: string | undefined, ahora = new Date()) {
  const mes = mesElegido(mesPedido, ahora);
  const [totales, publicada] = await Promise.all([
    totalesDelBarrio(sesion, rangoDelMes(mes), ahora),
    rendicionPublicadaDe(mes),
  ]);
  const cuentas = {
    mes,
    etiqueta: etiquetaDelMes(mes),
    meses: mesesQueSeOfrecen(ahora),
    seJunto: totales.seJunto,
    faltaCobrar: totales.faltaCobrar,
    semanas: totales.semanas,
    gastos: publicada
      ? {
          total: publicada.gastos,
          detalle: publicada.gastosPorConcepto.map((g) => ({ concepto: g.concepto, monto: g.monto })),
        }
      : null,
    actualizado: totales.actualizado
      ? `${fechaCorta(totales.actualizado)}, ${horaCorta(totales.actualizado)}`
      : null,
  };
  garantizarNoIdentificacion(cuentas);
  return cuentas;
}

export type CuentasDelBarrio = Awaited<ReturnType<typeof cuentasDelBarrio>>;

/** Las cuentas del barrio de un mes en PDF (VEC-TRA-01, «Descargar las cuentas»), con los mismos totales que la pantalla. */
export async function cuentasDelBarrioEnPdf(
  sesion: SesionDto,
  mesPedido: string | undefined,
  ahora = new Date(),
) {
  const c = await cuentasDelBarrio(sesion, mesPedido, ahora);
  const pdf = await generarPdf({
    titulo: `Cuentas del barrio · ${c.etiqueta}`,
    subtitulos: [
      "Cuánto se juntó para la vigilancia y en qué se usó. Son totales del barrio: no se ve lo que paga ninguna casa.",
      c.actualizado ? `Última actualización: ${c.actualizado}` : "Todavía no hay pagos validados.",
    ],
    secciones: [
      {
        titulo: "Resumen",
        filas: [
          ["Se juntó", soles(c.seJunto)],
          ["Falta cobrar", `${soles(c.faltaCobrar.monto)} (${c.faltaCobrar.cuotas} cuotas semanales)`],
          ...(c.gastos ? ([["Se gastó", soles(c.gastos.total)]] as [string, string][]) : []),
        ],
      },
      { titulo: "Lo que se juntó cada semana", filas: c.semanas.map((s) => [s.etiqueta, soles(s.total)]) },
      c.gastos
        ? { titulo: "En qué se gastó", filas: c.gastos.detalle.map((g) => [g.concepto, soles(g.monto)]) }
        : {
            titulo: "En qué se gastó",
            parrafos: ["La directiva todavía no publicó los gastos de este mes."],
          },
    ],
    pie: "Cuentas de la Junta Vecinal de Villa de Fátima. Se actualizan cada vez que la directiva valida un pago.",
  });
  return { pdf, nombre: `cuentas-del-barrio-${c.mes}.pdf` };
}
