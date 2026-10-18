// @HU-ASA-08
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { predioDelVecino, vecinosDeLaComunidad } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type DatosActividad,
  type DatosColaboracion,
  modalidadesAdmitidas,
  PAGOS_EN_TEXTO,
  prepararActividad,
  prepararColaboracion,
  TIPO_EN_TEXTO,
  UNIDAD_DE_ACTIVIDAD,
} from "@/modulos/asambleas/dominio/actividad";
import {
  actividadPorIdOperacion,
  adjuntarComprobante,
  buscarActividad,
  colaboracionDePredio,
  colaboracionPorIdOperacion,
  crearActividad,
  crearColaboracion,
  listarActividades,
} from "@/modulos/asambleas/infraestructura/repositorioActividades";

/** Ver y colaborar: los vecinos y también la directiva (que es vecina de su casa). */
const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/** Una actividad sigue «en curso» hasta 12 horas después de su hora, como las asambleas. */
const HORAS_EN_CURSO = 12;

export const USO_COMPROBANTE_APORTE = "comprobante_aporte";

type Fila = NonNullable<Awaited<ReturnType<typeof actividadPorIdOperacion>>>;

const aDto = (c: Fila) => {
  const evento = c.evento!;
  const unidad = UNIDAD_DE_ACTIVIDAD[evento.tipoActividad];
  return {
    id: c.id,
    nombre: c.titulo,
    tipoActividad: evento.tipoActividad,
    tipoTexto: TIPO_EN_TEXTO[evento.tipoActividad],
    unidad,
    paraQue: c.motivo,
    fechaHora: c.fechaHora.toISOString(),
    lugar: c.lugar,
    precioUnidad: evento.precioUnidad,
    precioTexto: soles(evento.precioUnidad),
    metaTexto: evento.metaRecaudacion === null ? null : soles(evento.metaRecaudacion),
    pagos: evento.pagos,
    pagosTexto: PAGOS_EN_TEXTO[evento.pagos],
    modalidades: modalidadesAdmitidas(evento.pagos),
    pideVoluntarios: evento.pideVoluntarios,
  };
};

export type ActividadDto = ReturnType<typeof aDto>;

/**
 * La directiva publica una actividad pro fondos (HU-ASA-08, DIR-ASA-17/18): los vecinos la ven en Actividades
 * pro-fondos y se avisa a cada casa. Todo en una transacción con su auditoría (AC-6); repetir el mismo
 * `idOperacion` devuelve la ya publicada sin avisar otra vez (AC-5).
 */
export async function publicarActividad(
  sesion: SesionDto,
  datos: DatosActividad & { idOperacion: string; pideVoluntarios: boolean },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { errores, actividad } = prepararActividad(datos, ahora);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await actividadPorIdOperacion(datos.idOperacion);
  if (previa?.evento) return { actividad: aDto(previa), creada: false };

  const fila = await prisma.$transaction(async (tx) => {
    const creada = await crearActividad(tx, {
      idOperacion: datos.idOperacion,
      titulo: actividad.nombre,
      motivo: actividad.paraQue,
      fechaHora: actividad.fechaHora,
      lugar: actividad.lugar,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
      tipoActividad: actividad.tipoActividad,
      precioUnidad: actividad.precioUnidad,
      metaRecaudacion: actividad.metaRecaudacion,
      pagos: actividad.pagos,
      pideVoluntarios: datos.pideVoluntarios,
    });
    const destinatarios = await vecinosDeLaComunidad(tx);
    const unidad = UNIDAD_DE_ACTIVIDAD[actividad.tipoActividad].singular;
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "ASAMBLEAS" as const,
        titulo: `Nueva actividad: ${actividad.nombre}`,
        texto: `${fechaLarga(actividad.fechaHora)}, ${horaCorta(actividad.fechaHora)}, en ${actividad.lugar}. ${soles(actividad.precioUnidad)} por ${unidad}. Colabore desde la app.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_actividad",
        entidad: "Actividad",
        entidadId: creada.id,
        antes: null,
        despues: {
          nombre: actividad.nombre,
          tipo: actividad.tipoActividad,
          precioUnidad: actividad.precioUnidad,
          avisados: destinatarios.length,
        },
      },
      tx,
    );
    return creada;
  });
  return { actividad: aDto(fila), creada: true };
}

/** Las actividades pro fondos publicadas, de la más próxima a la más lejana. */
export async function verActividades(sesion: SesionDto): Promise<ActividadDto[]> {
  exigirRol(sesion, ...ROLES_VECINO);
  return (await listarActividades()).filter((c) => c.evento).map(aDto);
}

/** La próxima actividad (o la que está en curso), o null si no hay (VEC-ASA-13). */
export async function proximaActividad(sesion: SesionDto, ahora = new Date()): Promise<ActividadDto | null> {
  const desde = ahora.getTime() - HORAS_EN_CURSO * 3_600_000;
  const vigentes = (await verActividades(sesion)).filter((a) => new Date(a.fechaHora).getTime() >= desde);
  return vigentes[0] ?? null;
}

export async function verActividad(sesion: SesionDto, id: string): Promise<ActividadDto> {
  exigirRol(sesion, ...ROLES_VECINO);
  const fila = await buscarActividad(id);
  if (!fila?.evento) throw new ErrorNoEncontrado();
  return aDto(fila);
}

type FilaColaboracion = NonNullable<Awaited<ReturnType<typeof colaboracionDePredio>>>;

const aDtoColaboracion = (c: FilaColaboracion) => ({
  id: c.id,
  cantidad: c.cantidad,
  modalidad: c.modalidad,
  monto: c.monto,
  montoTexto: soles(c.monto),
  estado: c.estado,
  tieneComprobante: c.archivoId !== null,
});

export type ColaboracionDto = ReturnType<typeof aDtoColaboracion>;

const MENSAJE_SIN_PREDIO =
  "No encontramos su vivienda en el padrón. Pida ayuda a la administración para colaborar.";

/**
 * Una casa elige cuánto y cómo colabora con una actividad (HU-ASA-08): la cantidad y la forma de pago (CA1). Si
 * paga antes, queda por revisar a la espera de su comprobante (CA2); si paga en la puerta, queda agendada para
 * el cobro del día (CA3). Una por casa. Repetir el mismo `idOperacion` devuelve la ya registrada (AC-5).
 */
export async function colaborar(
  sesion: SesionDto,
  actividadId: string,
  datos: DatosColaboracion & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previa = await colaboracionPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar un aporte ajeno con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { colaboracion: aDtoColaboracion(previa), creada: false };
  }

  const actividad = await buscarActividad(actividadId);
  if (!actividad?.evento) throw new ErrorNoEncontrado();
  const { errores, monto } = prepararColaboracion(
    datos,
    actividad.evento.pagos,
    actividad.evento.precioUnidad,
  );
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  if (ahora.getTime() > actividad.fechaHora.getTime()) {
    throw new ErrorReglaNegocio("Esta actividad ya se realizó: no se reciben más aportes.");
  }
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) throw new ErrorReglaNegocio(MENSAJE_SIN_PREDIO);
  if (await colaboracionDePredio(actividadId, predio.id)) {
    throw new ErrorReglaNegocio("Su casa ya registró su aporte a esta actividad.");
  }

  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearColaboracion(tx, {
      idOperacion: datos.idOperacion,
      convocatoriaId: actividadId,
      predioId: predio.id,
      autorId: sesion.usuarioId,
      cantidad: datos.cantidad,
      modalidad: datos.modalidad,
      monto,
      estado: datos.modalidad === "ANTICIPADA" ? "POR_REVISAR" : "AGENDADA",
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "colaborar_con_actividad",
        entidad: "Actividad",
        entidadId: actividadId,
        antes: null,
        despues: { predioId: predio.id, cantidad: datos.cantidad, modalidad: datos.modalidad, monto },
      },
      tx,
    );
    return fila;
  });
  return { colaboracion: aDtoColaboracion(creada), creada: true };
}

/** El aporte de la casa del vecino a esa actividad (VEC-ASA-13), o null si todavía no colaboró. */
export async function miColaboracion(
  sesion: SesionDto,
  actividadId: string,
): Promise<ColaboracionDto | null> {
  exigirRol(sesion, ...ROLES_VECINO);
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) return null;
  const fila = await colaboracionDePredio(actividadId, predio.id);
  return fila ? aDtoColaboracion(fila) : null;
}

/**
 * Adjunta el comprobante del aporte anticipado (HU-ASA-08 CA2): la foto que el vecino ya subió a R2. Solo se
 * acepta un archivo que subió esa misma persona para este uso, y solo en un aporte anticipado.
 */
export async function registrarComprobante(sesion: SesionDto, actividadId: string, archivoId: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const predio = await predioDelVecino(sesion.usuarioId);
  const colaboracion = predio ? await colaboracionDePredio(actividadId, predio.id) : null;
  if (!colaboracion) throw new ErrorNoEncontrado();
  if (colaboracion.modalidad !== "ANTICIPADA") {
    throw new ErrorReglaNegocio("Su aporte es en la puerta: no necesita comprobante.");
  }
  const propios = await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE_APORTE, [archivoId]);
  if (!propios.has(archivoId)) {
    throw new ErrorValidacion(undefined, { archivoId: "Suba de nuevo la foto de su comprobante." });
  }

  await prisma.$transaction(async (tx) => {
    await adjuntarComprobante(tx, colaboracion.id, archivoId);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "adjuntar_comprobante_aporte",
        entidad: "Actividad",
        entidadId: actividadId,
        antes: { archivoId: colaboracion.archivoId },
        despues: { archivoId },
      },
      tx,
    );
  });
  const actual = await colaboracionDePredio(actividadId, predio!.id);
  return aDtoColaboracion(actual!);
}
