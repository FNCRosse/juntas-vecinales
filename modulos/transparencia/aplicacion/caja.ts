// @HU-COB-14
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { prisma } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { ErrorConflicto, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta } from "@/compartido/fechas";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  CONCEPTOS_DE_GASTO,
  CONCEPTOS_DE_INGRESO,
  mesValido,
  nombreDelConcepto,
  prepararMovimiento,
  rangoDelMes,
  resumirMes,
  type TipoDeMovimiento,
} from "@/modulos/transparencia/dominio/caja";
import {
  bloquearMes,
  crearMovimiento,
  crearRendicion,
  movimientoPorIdOperacion,
  movimientosEntre,
  rendicionDelMes,
  rendicionDelMesEn,
  rendicionPorIdOperacion,
} from "@/modulos/transparencia/infraestructura/repositorioCaja";
import { USO_COMPROBANTE } from "./balances";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const MENSAJE_PUBLICADA = "Ese mes ya tiene su rendición publicada: no se pueden agregar más movimientos.";

const diaEnLima = (fecha: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);
/** El mediodía de un día de Lima: así cae en ese mismo día en cualquier zona. */
const alMediodia = (dia: string) => new Date(`${dia}T12:00:00-05:00`);
const inicioDelDia = (dia: string) => new Date(`${dia}T00:00:00-05:00`);

type Movimiento = NonNullable<Awaited<ReturnType<typeof movimientoPorIdOperacion>>>;
const aDto = (m: Movimiento) => ({
  id: m.id,
  tipo: m.tipo,
  concepto: nombreDelConcepto(m.concepto),
  detalle: m.detalle,
  monto: m.monto,
  fecha: fechaCorta(m.fecha),
  autor: m.autor,
  comprobanteId: m.archivoId,
});
export type MovimientoDto = ReturnType<typeof aDto>;

/**
 * Registra un ingreso o un gasto de la caja de vigilancia (HU-COB-14, DIR-TRA-03 y 04). Solo la directiva. Un gasto lleva la foto de
 * su comprobante, subida por quien lo registra. Queda en la auditoría en la misma transacción (AC-6). Repetir el mismo
 * `idOperacion` devuelve lo ya registrado (AC-5), y otra persona no puede reusarlo. Un mes con su rendición publicada ya no
 * admite movimientos; un error se corrige con otro movimiento, nunca se borra.
 */
export async function registrarMovimiento(
  sesion: SesionDto,
  datos: {
    tipo: string;
    monto: number;
    concepto: string;
    detalle?: string;
    fecha?: string;
    archivoId?: string;
    idOperacion: string;
  },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  const hoy = diaEnLima(ahora);
  const { errores, movimiento } = prepararMovimiento(
    {
      tipo: datos.tipo,
      monto: datos.monto,
      concepto: datos.concepto,
      detalle: datos.detalle ?? "",
      fecha: datos.fecha || hoy,
      archivoId: datos.archivoId ?? "",
    },
    hoy,
  );
  if (movimiento?.archivoId) {
    const propios = await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE, [movimiento.archivoId]);
    if (!propios.has(movimiento.archivoId)) errores.archivoId = "Adjunte la foto del comprobante del gasto.";
  }
  if (Object.keys(errores).length || !movimiento) throw new ErrorValidacion(undefined, errores);

  const mes = movimiento.fecha.slice(0, 7);
  const repetido = async () => {
    const previo = await movimientoPorIdOperacion(datos.idOperacion);
    if (!previo) return null;
    // Otra persona no puede ver ni reusar un movimiento ajeno con ese identificador (AC-7).
    if (previo.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { movimiento: aDto(previo), creado: false };
  };
  const yaEstaba = await repetido();
  if (yaEstaba) return yaEstaba;
  try {
    const creado = await prisma.$transaction(async (tx) => {
      await bloquearMes(tx, mes);
      if (await rendicionDelMesEn(tx, mes)) throw new ErrorReglaNegocio(MENSAJE_PUBLICADA);
      const fila = await crearMovimiento(tx, {
        idOperacion: datos.idOperacion,
        tipo: movimiento.tipo,
        concepto: movimiento.concepto,
        detalle: movimiento.detalle,
        monto: movimiento.monto,
        fecha: alMediodia(movimiento.fecha),
        archivoId: movimiento.archivoId,
        autorId: sesion.usuarioId,
        autor: sesion.nombreCompleto,
      });
      await registrarAuditoria(
        {
          actorId: sesion.usuarioId,
          accion: "registrar_movimiento_caja",
          entidad: "MovimientoDeCaja",
          entidadId: fila.id,
          antes: null,
          despues: {
            tipo: movimiento.tipo === "GASTO" ? "Gasto" : "Ingreso",
            concepto: nombreDelConcepto(movimiento.concepto),
            monto: soles(movimiento.monto),
            fecha: movimiento.fecha,
          },
        },
        tx,
      );
      return fila;
    });
    return { movimiento: aDto(creado), creado: true };
  } catch (error) {
    // Otra petición con el mismo identificador llegó primero: ya está registrado.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const yaEstaba = await repetido();
      if (yaEstaba) return yaEstaba;
    }
    throw error;
  }
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const etiquetaDelMes = (mes: string) => {
  const nombre = MESES[Number(mes.slice(5)) - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${mes.slice(0, 4)}`;
};

/** El mes pedido, o el mes en curso si no es uno válido. */
export const mesElegido = (pedido: string | undefined, ahora: Date) =>
  pedido && mesValido(pedido) ? pedido : diaEnLima(ahora).slice(0, 7);

/** Los meses que ofrecen las listas: el mes en curso y los dos anteriores. */
export function mesesQueSeOfrecen(ahora: Date) {
  return opcionesDelTablero(undefined, ahora)
    .periodos.filter((p) => mesValido(p.valor))
    .map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }));
}

/**
 * La rendición de cuentas de un mes (DIR-TRA-01 y DIR-TRA-05): lo que entró (las cuotas, que son los recibos emitidos, y otros
 * ingresos), lo que se gastó y en qué, el saldo, los movimientos con su comprobante y si ya se publicó. La ven la directiva y el
 * mediador; solo la directiva registra y publica.
 */
export async function rendicionDeCuentas(
  sesion: SesionDto,
  mesPedido: string | undefined,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const mes = mesElegido(mesPedido, ahora);
  const { desde, hasta } = rangoDelMes(mes);
  const [recaudacion, filas, publicada] = await Promise.all([
    consultarTablero(sesion, { desde, hasta }, ahora),
    movimientosEntre(inicioDelDia(desde), new Date(inicioDelDia(hasta).getTime() + 86_400_000)),
    rendicionDelMes(mes),
  ]);
  const resumen = resumirMes({
    cuotas: recaudacion.seCobro,
    movimientos: filas.map((m) => ({
      tipo: m.tipo as TipoDeMovimiento,
      concepto: m.concepto,
      monto: m.monto,
      archivoId: m.archivoId,
    })),
  });
  return {
    mes,
    etiqueta: etiquetaDelMes(mes),
    meses: mesesQueSeOfrecen(ahora),
    ...resumen,
    movimientos: filas.map(aDto),
    publicada: publicada ? { por: publicada.publicadaPor, cuando: fechaCorta(publicada.publicadaEn) } : null,
  };
}

export type RendicionDeCuentas = Awaited<ReturnType<typeof rendicionDeCuentas>>;

function aRendicion(r: NonNullable<Awaited<ReturnType<typeof rendicionDelMes>>>) {
  return {
    mes: r.mes,
    etiqueta: etiquetaDelMes(r.mes),
    ingresos: r.ingresosPorCuotas + r.ingresosOtros,
    gastos: r.gastos,
    saldo: r.ingresosPorCuotas + r.ingresosOtros - r.gastos,
    comprobantes: r.comprobantes,
    gastosPorConcepto: r.gastosPorConcepto as { concepto: string; monto: number }[],
    publicadaPor: r.publicadaPor,
  };
}

/**
 * Publica la rendición de un mes para los vecinos (HU-COB-14, DIR-TRA-02): guarda los totales y los gastos por concepto como están
 * ahora y queda inalterable (trigger). Solo la directiva; una sola por mes; no se publica un mes sin ningún movimiento. Queda
 * en la auditoría. Repetir el mismo `idOperacion` devuelve lo ya publicado (AC-5).
 */
export async function publicarRendicion(
  sesion: SesionDto,
  datos: { mes: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  if (!mesValido(datos.mes)) throw new ErrorValidacion(undefined, { mes: "Elija el mes de la rendición." });
  const previa = await rendicionPorIdOperacion(datos.idOperacion);
  if (previa) {
    if (previa.publicadaPorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { rendicion: aRendicion(previa), creada: false };
  }
  const r = await rendicionDeCuentas(sesion, datos.mes, ahora);
  if (r.ingresos === 0 && r.gastos === 0) {
    throw new ErrorReglaNegocio("Ese mes no tiene ningún ingreso ni gasto para publicar.");
  }
  const creada = await prisma.$transaction(async (tx) => {
    await bloquearMes(tx, datos.mes);
    if (await rendicionDelMesEn(tx, datos.mes)) {
      throw new ErrorConflicto("La rendición de ese mes ya se publicó.");
    }
    const fila = await crearRendicion(tx, {
      idOperacion: datos.idOperacion,
      mes: datos.mes,
      ingresosPorCuotas: r.ingresosPorCuotas,
      ingresosOtros: r.ingresosOtros,
      gastos: r.gastos,
      comprobantes: r.comprobantes,
      gastosPorConcepto: r.gastosPorConcepto.map((g) => ({ concepto: g.concepto, monto: g.monto })),
      publicadaPorId: sesion.usuarioId,
      publicadaPor: sesion.nombreCompleto,
      publicadaEn: ahora,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_rendicion",
        entidad: "Rendicion",
        entidadId: datos.mes,
        antes: null,
        despues: {
          mes: r.etiqueta,
          ingresos: soles(r.ingresos),
          gastos: soles(r.gastos),
          saldo: soles(r.saldo),
          comprobantes: r.comprobantes,
        },
      },
      tx,
    );
    return fila;
  });
  return { rendicion: aRendicion(creada), creada: true };
}

/** La rendición publicada de un mes, para lo que ven los vecinos (VEC-TRA-01); `null` si todavía no se publicó. */
export async function rendicionPublicadaDe(mes: string) {
  const fila = await rendicionDelMes(mes);
  return fila ? aRendicion(fila) : null;
}

/** Los conceptos que se ofrecen al registrar un gasto o un ingreso, con las palabras del prototipo. */
export function conceptosDeCaja() {
  const lista = (conceptos: Record<string, string>) =>
    Object.entries(conceptos).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  return { GASTO: lista(CONCEPTOS_DE_GASTO), INGRESO: lista(CONCEPTOS_DE_INGRESO) };
}
