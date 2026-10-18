// @HU-ASA-01 @HU-ASA-02 @HU-ASA-04 @HU-ASA-07 @HU-ASA-13
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import {
  fechaEnFrase,
  fechaLarga,
  horaCorta,
  inicioDelDiaEnLima,
  visperaALasOchoPm,
} from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import {
  buscarVecinos,
  predioDelVecino,
  totalDePredios,
  vecinosDeLaComunidad,
} from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type DatosConvocatoria,
  prepararConvocatoria,
  quorumRequerido,
} from "@/modulos/asambleas/dominio/convocatoria";
import { DIAS_ANTES_DEL_CIERRE_DE_AGENDA } from "@/modulos/asambleas/dominio/propuesta";
import { proyectarQuorum, textoDelQuorum } from "@/modulos/asambleas/dominio/quorum";
import {
  buscarAsamblea,
  buscarPorIdOperacion,
  cancelarConfirmacion,
  confirmacionDePredio,
  confirmarAsistencia as guardarConfirmacion,
  crearAsamblea,
  listarAsambleas,
} from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";

type Fila = NonNullable<Awaited<ReturnType<typeof buscarPorIdOperacion>>>;

/**
 * El último instante en que se pueden proponer temas: el fin del día (en Lima) que está 9 días antes de la
 * asamblea («Puede enviarlo hasta el jueves 1 de octubre», HU-ASA-13). Si la asamblea se reprograma, se corre sola.
 */
export function cierreDeAgenda(fechaHora: Date): Date {
  const dia = inicioDelDiaEnLima(
    new Date(fechaHora.getTime() - DIAS_ANTES_DEL_CIERRE_DE_AGENDA * 86_400_000),
  );
  return new Date(dia.getTime() + 86_400_000 - 1);
}

export const aDto = (c: Fila) => {
  const digital = c.confirmaciones.filter((f) => f.modo === "DIGITAL").length;
  const asistida = c.confirmaciones.filter((f) => f.modo === "ASISTIDA").length;
  const padronTotal = c.asamblea?.padronTotal ?? 0;
  const requerido = c.asamblea?.quorumRequerido ?? 0;
  // Se recalcula en cada lectura a partir de las confirmaciones, así siempre refleja la última (HU-ASA-04 CA1).
  const quorum = proyectarQuorum({ padronTotal, requerido, digital, asistida });
  return {
    id: c.id,
    titulo: c.titulo,
    tipoAsamblea: c.asamblea?.tipoAsamblea ?? ("ORDINARIA" as const),
    fechaHora: c.fechaHora.toISOString(),
    lugar: c.lugar,
    motivo: c.motivo,
    estado: c.estado,
    confirmacionesHasta: (c.asamblea?.confirmacionesHasta ?? c.fechaHora).toISOString(),
    cierreAgenda: cierreDeAgenda(c.fechaHora).toISOString(),
    padronTotal,
    quorumRequerido: requerido,
    confirmados: { digital, asistida, total: quorum.confirmados },
    // Hay votación presencial si la directiva las abrió tras comprobar el quórum definitivo (HU-ASA-07 CA3);
    // una sesión informativa no tiene votaciones. En la app solo se muestra el estado: no hay voto digital.
    votacion: (c.estado === "INFORMATIVA"
      ? "SIN_VOTACION"
      : c.asamblea?.votacionesAbiertasEn
        ? "ABIERTA"
        : "CERRADA") as "SIN_VOTACION" | "ABIERTA" | "CERRADA",
    quorum: { ...quorum, texto: textoDelQuorum(quorum) },
  };
};

export type AsambleaDto = ReturnType<typeof aDto>;

/**
 * Publica una convocatoria a asamblea (HU-ASA-01): queda en PUBLICADA, avisa a cada vecino activo en el
 * centro de avisos (CA1) y el afiche se arma de la misma fila (CA2, CA3), todo en una transacción (AC-6).
 * Repetir el mismo `idOperacion` devuelve lo ya publicado sin publicar ni avisar otra vez (AC-5).
 */
export async function publicarConvocatoria(
  sesion: SesionDto,
  datos: DatosConvocatoria & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const { errores, convocatoria } = prepararConvocatoria(datos, ahora);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await buscarPorIdOperacion(datos.idOperacion);
  if (previa) return { asamblea: aDto(previa), creada: false };

  const padronTotal = await totalDePredios();

  const fila = await prisma.$transaction(async (tx) => {
    const creada = await crearAsamblea(tx, {
      idOperacion: datos.idOperacion,
      titulo: convocatoria.titulo,
      tipoAsamblea: convocatoria.tipoAsamblea,
      fechaHora: convocatoria.fechaHora,
      lugar: convocatoria.lugar,
      motivo: convocatoria.motivo,
      padronTotal,
      quorumRequerido: quorumRequerido(padronTotal),
      confirmacionesHasta: visperaALasOchoPm(convocatoria.fechaHora),
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
    });
    const destinatarios = await vecinosDeLaComunidad(tx);
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "ASAMBLEAS" as const,
        titulo: `Nueva ${convocatoria.titulo.toLowerCase()}`,
        texto: `${fechaLarga(convocatoria.fechaHora)}, ${horaCorta(convocatoria.fechaHora)}, en ${convocatoria.lugar}. Confirme su asistencia en la app.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_convocatoria",
        entidad: "Convocatoria",
        entidadId: creada.id,
        antes: null,
        despues: {
          titulo: convocatoria.titulo,
          fechaHora: convocatoria.fechaHora,
          avisados: destinatarios.length,
        },
      },
      tx,
    );
    return creada;
  });
  return { asamblea: aDto(fila), creada: true };
}

/** Las asambleas convocadas (DIR-ASA-01 y VEC-ASA-01), de la más próxima a la más lejana. */
export async function verAsambleas(sesion: SesionDto): Promise<AsambleaDto[]> {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  return (await listarAsambleas()).map(aDto);
}

/** Una asamblea sigue "en curso" hasta 12 horas después de su hora: el día de la reunión no desaparece de la lista. */
const HORAS_EN_CURSO = 12;

/** La próxima asamblea (o la que está en curso), o null si no hay (bloque del inicio, DIR-INI-01 / VEC-ACC-09). */
export async function proximaAsamblea(sesion: SesionDto, ahora = new Date()): Promise<AsambleaDto | null> {
  const desde = ahora.getTime() - HORAS_EN_CURSO * 3_600_000;
  const futuras = (await verAsambleas(sesion)).filter((a) => new Date(a.fechaHora).getTime() >= desde);
  return futuras[0] ?? null;
}

/** Una asamblea por su id (afiche y detalle, HU-ASA-01 CA2). */
export async function verAsamblea(sesion: SesionDto, id: string): Promise<AsambleaDto> {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const fila = await buscarAsamblea(id);
  if (!fila) throw new ErrorNoEncontrado();
  return aDto(fila);
}

const MENSAJE_SIN_PREDIO =
  "No encontramos su vivienda en el padrón. Pida ayuda a la administración para confirmar su asistencia.";

/** La asamblea si sigue abierta a confirmaciones y delegaciones (no cerrada, antes del plazo); si no, el error. */
export async function asambleaVigente(id: string, ahora: Date) {
  const fila = await buscarAsamblea(id);
  if (!fila || !fila.asamblea) throw new ErrorNoEncontrado();
  if (fila.estado === "CERRADA") throw new ErrorReglaNegocio("Esta asamblea ya está cerrada.");
  if (ahora.getTime() > fila.asamblea.confirmacionesHasta.getTime()) {
    throw new ErrorReglaNegocio("El plazo para confirmar la asistencia ya cerró.");
  }
  return fila;
}

/**
 * El vecino confirma la asistencia de su predio (HU-ASA-02 CA1): una por predio (CA2), editable hasta el
 * plazo (CA3). Idempotente por el par convocatoria–predio y auditada en la misma transacción (AC-5, AC-6).
 */
export async function confirmarAsistencia(sesion: SesionDto, asambleaId: string, ahora = new Date()) {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) throw new ErrorReglaNegocio(MENSAJE_SIN_PREDIO);
  await asambleaVigente(asambleaId, ahora);

  await prisma.$transaction(async (tx) => {
    await guardarConfirmacion(tx, {
      convocatoriaId: asambleaId,
      predioId: predio.id,
      modo: "DIGITAL",
      registradaPor: null,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "confirmar_asistencia",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { predioId: predio.id, modo: "DIGITAL" },
      },
      tx,
    );
  });
  return verAsamblea(sesion, asambleaId);
}

/** El vecino cambia su respuesta antes del plazo: su casa ya no asistirá (HU-ASA-02 CA3). */
export async function cancelarAsistencia(sesion: SesionDto, asambleaId: string, ahora = new Date()) {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) throw new ErrorReglaNegocio(MENSAJE_SIN_PREDIO);
  await asambleaVigente(asambleaId, ahora);

  await prisma.$transaction(async (tx) => {
    await cancelarConfirmacion(tx, asambleaId, predio.id);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "cancelar_asistencia",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: { predioId: predio.id },
        despues: null,
      },
      tx,
    );
  });
  return verAsamblea(sesion, asambleaId);
}

/**
 * Un mediador busca al vecino por nombre o DNI y ve si su casa ya confirmó (HU-ASA-03 CA1). Un vecino
 * puede estar confirmado en la app o ya asentado por un mediador; el resultado lo dice (CA2).
 */
export async function buscarParaAsistencia(sesion: SesionDto, asambleaId: string, texto: string) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const vecinos = await buscarVecinos(texto);
  return Promise.all(
    vecinos.map(async (v) => {
      const confirmacion = await confirmacionDePredio(asambleaId, v.predioId);
      return {
        ...v,
        confirmacion: confirmacion
          ? { modo: confirmacion.modo, registradaPor: confirmacion.registradaPor }
          : null,
      };
    }),
  );
}

/**
 * El mediador asienta la confirmación de un vecino (adulto mayor) que no usa la app (HU-ASA-03 CA2): queda
 * ASISTIDA y acreditada al predio, con quién la registró. Suma al indicador de asistencia preliminar (CA3).
 */
export async function registrarAsistenciaAsistida(
  sesion: SesionDto,
  asambleaId: string,
  predioId: string,
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  await asambleaVigente(asambleaId, ahora);
  const previa = await confirmacionDePredio(asambleaId, predioId);
  // Si el vecino ya confirmó por su cuenta, esa confirmación manda y no se pisa (ADR-005).
  if (previa?.modo === "DIGITAL") return verAsamblea(sesion, asambleaId);

  await prisma.$transaction(async (tx) => {
    await guardarConfirmacion(tx, {
      convocatoriaId: asambleaId,
      predioId,
      modo: "ASISTIDA",
      registradaPor: sesion.usuarioId,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "registrar_asistencia_asistida",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { predioId, modo: "ASISTIDA" },
      },
      tx,
    );
  });
  return verAsamblea(sesion, asambleaId);
}

/** El mediador anula un registro que él asentó (HU-ASA-03): la asistencia del vecino vuelve a "sin confirmar". */
export async function anularAsistenciaAsistida(
  sesion: SesionDto,
  asambleaId: string,
  predioId: string,
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  await asambleaVigente(asambleaId, ahora);
  const previa = await confirmacionDePredio(asambleaId, predioId);
  if (!previa || previa.modo !== "ASISTIDA") {
    throw new ErrorReglaNegocio("Solo se puede anular un registro hecho por un mediador.");
  }
  await prisma.$transaction(async (tx) => {
    await cancelarConfirmacion(tx, asambleaId, predioId);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "anular_asistencia_asistida",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: { predioId, modo: "ASISTIDA" },
        despues: null,
      },
      tx,
    );
  });
  return verAsamblea(sesion, asambleaId);
}

/** Si la casa del vecino ya confirmó su asistencia a esta asamblea (para pintar su estado en VEC-ASA-01). */
export async function miAsistencia(sesion: SesionDto, asambleaId: string): Promise<boolean> {
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) return false;
  return (await confirmacionDePredio(asambleaId, predio.id)) !== null;
}

/** El afiche A4 imprimible: los mismos datos de la publicación, nada escrito dos veces (HU-ASA-01 CA2, CA3). */
export function aficheDeAsamblea(asamblea: AsambleaDto) {
  const fecha = new Date(asamblea.fechaHora);
  return {
    titulo: "Junta Vecinal de Villa de Fátima",
    subtitulos: [asamblea.titulo],
    secciones: [
      {
        titulo: "Cuándo y dónde",
        filas: [
          ["Fecha", fechaLarga(fecha)] as [string, string],
          ["Hora", horaCorta(fecha)] as [string, string],
          ["Lugar", asamblea.lugar] as [string, string],
        ],
      },
      { titulo: "Motivo", parrafos: [asamblea.motivo] },
    ],
    pie: `Confirme su asistencia en la app o con un mediador de la directiva, hasta ${fechaEnFrase(new Date(asamblea.confirmacionesHasta))}.`,
    nombreArchivo: `asamblea-${asamblea.id}.pdf`,
  };
}
