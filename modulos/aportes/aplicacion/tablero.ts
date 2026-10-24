// @HU-COB-13
import { ErrorValidacion } from "@/compartido/errores";
import { desdeHoraDeLima } from "@/compartido/fechas";
import { sumarDias } from "@/modulos/aportes/dominio/cuota";
import { clasificarMorosidad } from "@/modulos/aportes/dominio/morosidad";
import {
  consolidar,
  cuadra,
  FILTROS_DE_ESTADO,
  filtroDeMorosidad,
  periodosPredefinidos,
  prepararConsulta,
  resolverPeriodo,
} from "@/modulos/aportes/dominio/tablero";
import { diaEnLima } from "@/modulos/aportes/dominio/tarifa";
import { cuotasImpagasPorCasa } from "@/modulos/aportes/infraestructura/repositorioMorosidad";
import {
  type CasasMiradas,
  cuotasPorCobrar,
  pagosAprobadosDelPeriodo,
  pagosAprobadosSinRecibo,
  recibosDelPeriodo,
} from "@/modulos/aportes/infraestructura/repositorioTablero";
import { ocupacionDeLasCasas } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/**
 * El tablero de recaudación (HU-COB-13): lo cobrado en un rango de fechas, sumando los recibos emitidos, digitales y en
 * efectivo (CA1); filtrado por el estado actual de la casa —al día, atraso de 1 a 7 semanas u 8 o más— y por fechas (CA2);
 * y con la comprobación de que cuadra: el total de los recibos, la suma de la tabla por semana y lo que suman los pagos
 * aprobados tienen que dar lo mismo al céntimo, y no puede haber un pago aprobado sin recibo (CA3). Es de solo lectura.
 * Sin pedir nada, mira el mes en curso hasta hoy. El estado de una casa es el de su atraso de hoy, como el semáforo de la
 * garita: las cuotas que reclama no cuentan.
 */
export async function consultarTablero(
  sesion: SesionDto,
  entrada: { desde?: string; hasta?: string; estado?: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { errores, consulta } = prepararConsulta(entrada, diaEnLima(ahora));
  if (!consulta) throw new ErrorValidacion(undefined, errores);
  const desde = desdeHoraDeLima(consulta.desde, "00:00");
  const hasta = desdeHoraDeLima(sumarDias(consulta.hasta, 1), "00:00");

  const [impagas, casasConResidentes] = await Promise.all([cuotasImpagasPorCasa(), ocupacionDeLasCasas()]);
  const conResidentes = new Set(casasConResidentes.map((c) => c.predioId));
  const estados = new Map(
    [...impagas]
      .filter(([predioId]) => conResidentes.has(predioId))
      .map(
        ([predioId, cuotas]) => [predioId, filtroDeMorosidad(clasificarMorosidad(cuotas, ahora))] as const,
      ),
  );
  const conEstado = (estado: string) => [...estados].filter(([, e]) => e === estado).map(([id]) => id);
  const noAlDia = [...estados].filter(([, e]) => e !== "AL_DIA").map(([id]) => id);
  const atraso = conEstado("ATRASO").length;
  const critico = conEstado("CRITICO").length;
  const casas: CasasMiradas =
    consulta.estado === "TODAS"
      ? null
      : consulta.estado === "AL_DIA"
        ? { fuera: noAlDia }
        : { en: conEstado(consulta.estado) };

  const [recibos, pagos, sinRecibo, porCobrar] = await Promise.all([
    recibosDelPeriodo(desde, hasta, casas),
    pagosAprobadosDelPeriodo(desde, hasta, casas),
    pagosAprobadosSinRecibo(casas),
    cuotasPorCobrar(desde, hasta, casas),
  ]);
  const t = consolidar(
    recibos.map((r) => ({ monto: r.monto, fecha: r.fecha, digital: r.pago.medio !== "EFECTIVO" })),
    consulta.desde,
    consulta.hasta,
  );
  const porSemana = t.semanas.reduce((suma, s) => suma + s.total, 0);
  return {
    periodo: { desde: consulta.desde, hasta: consulta.hasta },
    estado: consulta.estado,
    seCobro: t.total,
    recibos: t.cantidad,
    digital: t.digital,
    efectivo: t.efectivo,
    faltaCobrar: porCobrar,
    casas: { total: conResidentes.size, alDia: conResidentes.size - atraso - critico, atraso, critico },
    cuadra: {
      ok: cuadra(t.total, porSemana, pagos) && sinRecibo === 0,
      recibos: t.total,
      semanas: porSemana,
      pagos,
      pagosSinRecibo: sinRecibo,
    },
    semanas: t.semanas,
  };
}

export type TableroDto = Awaited<ReturnType<typeof consultarTablero>>;

/** Para las pantallas: los periodos y estados que ofrecen las listas, y el periodo elegido (el mes en curso si no es ninguno). */
export function opcionesDelTablero(periodo: string | undefined, ahora = new Date()) {
  const hoy = diaEnLima(ahora);
  return {
    periodos: periodosPredefinidos(hoy),
    periodo: resolverPeriodo(periodo, hoy),
    estados: FILTROS_DE_ESTADO,
  };
}
