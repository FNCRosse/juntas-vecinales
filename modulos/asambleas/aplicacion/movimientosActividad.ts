// @HU-ASA-10
import { prisma } from "@/compartido/bd/cliente";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta } from "@/compartido/fechas";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type DatosMovimiento,
  prepararMovimiento,
  totalesDeActividad,
} from "@/modulos/asambleas/dominio/movimientoActividad";
import { UNIDAD_DE_ACTIVIDAD } from "@/modulos/asambleas/dominio/actividad";
import { buscarActividad } from "@/modulos/asambleas/infraestructura/repositorioActividades";
import {
  colaboracionesDeActividad,
  crearMovimiento,
  movimientoPorIdOperacion,
  movimientosDeActividad,
} from "@/modulos/asambleas/infraestructura/repositorioMovimientosActividad";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
/** El comprobante de un gasto es el mismo uso que el de los balances: lo suben y lo ven la directiva y el mediador. */
export const USO_COMPROBANTE_GASTO = "comprobante_egreso";

/**
 * La directiva anota un gasto (con su comprobante) o lo cobrado en la puerta de una actividad pro fondos (HU-ASA-10,
 * prototipo DAS09). Queda para el balance. Con el balance publicado ya no se anota nada: eso lo cuida transparencia
 * (anotarEnActividad), que es quien sabe del balance. Repetir el mismo `idOperacion`
 * devuelve lo ya anotado (AC-5). Se audita en la misma transacción (AC-6).
 */
export async function registrarMovimientoDeActividad(
  sesion: SesionDto,
  actividadId: string,
  datos: DatosMovimiento & { idOperacion: string },
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const previo = await movimientoPorIdOperacion(datos.idOperacion);
  if (previo) {
    if (previo.convocatoriaId !== actividadId) throw new ErrorNoEncontrado();
    return { movimiento: previo, creado: false };
  }
  const actividad = await buscarActividad(actividadId);
  if (!actividad?.evento) throw new ErrorNoEncontrado();
  const { errores, movimiento } = prepararMovimiento(datos);
  if (movimiento.archivoId) {
    const propios = await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE_GASTO, [movimiento.archivoId]);
    if (!propios.has(movimiento.archivoId)) errores.archivoId = "Suba de nuevo la foto del comprobante.";
  }
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const creado = await prisma.$transaction(async (tx) => {
    const fila = await crearMovimiento(tx, {
      ...movimiento,
      idOperacion: datos.idOperacion,
      convocatoriaId: actividadId,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "registrar_movimiento_actividad",
        entidad: "Actividad",
        entidadId: actividadId,
        antes: null,
        despues: { tipo: fila.tipo, concepto: fila.concepto, monto: fila.monto },
      },
      tx,
    );
    return fila;
  });
  return { movimiento: creado, creado: true };
}

/**
 * Cómo va una actividad (prototipo DAS09): cuántas unidades se pidieron, lo pagado por adelantado, lo cobrado en la puerta,
 * los gastos con su comprobante y la utilidad. Es lo que copiará el balance al publicarse. Solo la directiva: los vecinos
 * ven el balance publicado.
 */
export async function resumenDeActividad(sesion: SesionDto, actividadId: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const actividad = await buscarActividad(actividadId);
  if (!actividad?.evento) throw new ErrorNoEncontrado();
  const [colaboraciones, movimientos] = await Promise.all([
    colaboracionesDeActividad(actividadId),
    movimientosDeActividad(actividadId),
  ]);
  // Lo pagado por adelantado cuenta cuando trae su comprobante; lo de la puerta, cuando la directiva lo anota.
  const anticipados = colaboraciones
    .filter((c) => c.modalidad === "ANTICIPADA" && c.archivoId)
    .map((c) => c.monto);
  const totales = totalesDeActividad(anticipados, movimientos);
  const unidades = colaboraciones.reduce((s, c) => s + c.cantidad, 0);
  const unidad = UNIDAD_DE_ACTIVIDAD[actividad.evento.tipoActividad];
  const aFila = (m: (typeof movimientos)[number]) => ({
    id: m.id,
    concepto: m.concepto,
    monto: m.monto,
    montoTexto: soles(m.monto),
    archivoId: m.archivoId,
    fecha: fechaCorta(m.creadoEn),
    autor: m.autor,
  });
  return {
    unidades,
    unidadesTexto: `${unidades} ${unidades === 1 ? unidad.singular : unidad.plural}`,
    totales,
    gastos: movimientos.filter((m) => m.tipo === "GASTO").map(aFila),
    cobrosEnPuerta: movimientos.filter((m) => m.tipo === "INGRESO_EN_PUERTA").map(aFila),
    porAdelantado: {
      casas: anticipados.length,
      sinComprobante: colaboraciones.filter((c) => c.modalidad === "ANTICIPADA" && !c.archivoId).length,
    },
  };
}

export type ResumenDeActividad = Awaited<ReturnType<typeof resumenDeActividad>>;
