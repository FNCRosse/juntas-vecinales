// @HU-QUE-07
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, fechaYHora } from "@/compartido/fechas";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  ENTIDADES,
  type Entidad,
  numeroDeOficio,
  prepararDerivacion,
} from "@/modulos/incidencias/dominio/gestion";
import { CATEGORIAS, lugarEnTexto, numeroVisible } from "@/modulos/incidencias/dominio/queja";
import {
  abrirExpediente,
  buscarParaGestion,
  cambiarSiSigueEn,
} from "@/modulos/incidencias/infraestructura/repositorioQuejas";
import { avisarAlDenunciante } from "./avisarDenunciante";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
export { ENTIDADES };

export const MENSAJE_NO_SE_DERIVA = "Este reporte ya está cerrado: no se puede derivar. Revise su estado.";

const anioEnLima = (fecha: Date) =>
  Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric" }).format(fecha));

type Fila = NonNullable<Awaited<ReturnType<typeof buscarParaGestion>>>;

const pruebasEnTexto = (q: Fila) => {
  const videos = q.evidencias.filter((e) => e.archivo.tipo.startsWith("video/")).length;
  const fotos = q.evidencias.length - videos;
  const partes = [
    fotos && `${fotos} ${fotos === 1 ? "foto" : "fotos"}`,
    videos && `${videos} ${videos === 1 ? "video" : "videos"}`,
  ].filter(Boolean);
  return partes.length
    ? `${partes.join(" y ")}, en custodia de la junta`
    : "Relato del vecino, sin foto ni video";
};

/** El oficio "N.° 015-2026-JVVF" de una queja derivada; null si no se derivó. */
export const oficioDe = (q: { expediente: { numeroOficio: number; fecha: Date; entidad: Entidad } | null }) =>
  q.expediente && {
    numero: numeroDeOficio(q.expediente.numeroOficio, anioEnLima(q.expediente.fecha)),
    entidad: ENTIDADES[q.expediente.entidad],
  };

/**
 * El expediente digital (HU-QUE-07 CA2): pruebas, descripción y coordenadas, con el oficio de
 * derivación. Antes de derivar sirve de vista previa, sin número de oficio.
 */
async function documentoDelOficio(q: Fila, entidad: Entidad) {
  const oficio = oficioDe(q);
  const quien = q.esAnonimo
    ? "Reserva de identidad (reporte anónimo)"
    : ((q.denuncianteId && (await nombresDe([q.denuncianteId])).get(q.denuncianteId)) ??
      "Persona ya no registrada");
  return generarPdf({
    titulo: oficio ? `Oficio ${oficio.numero}` : "Oficio de derivación (vista previa)",
    subtitulos: [
      "Junta Vecinal de Villa de Fátima",
      `Lima, ${fechaLarga(q.expediente?.fecha ?? new Date())}`,
      `Para: ${ENTIDADES[entidad]}`,
    ],
    secciones: [
      {
        titulo: "Asunto",
        parrafos: [
          `Derivación del reporte vecinal ${numeroVisible(q.numero)} (código ${q.codigoTicket}), por tratarse de una posible falta o delito que la junta no puede resolver.`,
        ],
      },
      {
        titulo: "Expediente",
        filas: [
          ["Caso", CATEGORIAS[q.categoria]],
          ["Fecha del reporte", fechaYHora(q.fechaRegistro)],
          ["Lugar", lugarEnTexto(q.manzana, q.referencia)],
          [
            "Coordenadas",
            q.latitud != null && q.longitud != null ? `${q.latitud}, ${q.longitud}` : "No se registraron",
          ],
          ["Pruebas", pruebasEnTexto(q)],
          ["Quién reporta", quien],
        ],
        parrafos: [`Descripción: ${q.descripcion}`],
      },
    ],
    pie: "La junta entrega este oficio a la entidad en persona. Las pruebas están a su disposición.",
  });
}

/**
 * Deriva el reporte a la PNP o la Municipalidad (HU-QUE-07): abre el expediente con su oficio, pasa a
 * "Derivado a una entidad externa" (CA3), se audita y se avisa a quien reportó, que podrá descargar el
 * oficio, todo en una transacción (AC-6).
 */
export async function derivarQueja(
  sesion: SesionDto,
  id: string,
  datos: { entidad?: string | null },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const q = await buscarParaGestion(id);
  if (!q) throw new ErrorNoEncontrado();
  const resultado = prepararDerivacion(q.estado, datos.entidad);
  if ("noSePuede" in resultado) throw new ErrorConflicto(MENSAJE_NO_SE_DERIVA);
  if (!resultado.entidad) throw new ErrorValidacion(undefined, resultado.errores);
  const entidad = resultado.entidad;

  const oficio = await prisma.$transaction(async (tx) => {
    const cambiada = await cambiarSiSigueEn(tx, id, q.estado, {
      estado: "DERIVADO_ENTIDAD_EXTERNA",
      fechaCierre: ahora,
    });
    if (!cambiada) throw new ErrorConflicto(MENSAJE_NO_SE_DERIVA);
    const expediente = await abrirExpediente(tx, {
      quejaId: id,
      entidad,
      fecha: ahora,
      responsableId: sesion.usuarioId,
    });
    const oficio = numeroDeOficio(expediente.numeroOficio, anioEnLima(ahora));
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "derivar_queja",
        entidad: "Queja",
        entidadId: id,
        antes: { estado: q.estado },
        despues: { estado: "DERIVADO_ENTIDAD_EXTERNA", entidad, oficio },
      },
      tx,
    );
    await avisarAlDenunciante(
      q,
      {
        titulo: "Su reporte pasó a otra entidad",
        texto: `La junta envió su reporte ${numeroVisible(q.numero)} a ${ENTIDADES[entidad]} con el oficio ${oficio}. Puede descargarlo en el avance de su reporte.`,
      },
      tx,
    );
    return oficio;
  });
  return { oficio, entidad: ENTIDADES[entidad] };
}

const nombreDelArchivo = (q: Fila) => `oficio-reporte-${String(q.numero).padStart(5, "0")}.pdf`;

/** El oficio para la directiva: el definitivo si ya se derivó; si no, la vista previa para esa entidad. */
export async function oficioParaDirectiva(sesion: SesionDto, id: string, entidad?: string | null) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const q = await buscarParaGestion(id);
  if (!q) throw new ErrorNoEncontrado();
  const destino = q.expediente?.entidad ?? (entidad && entidad in ENTIDADES ? (entidad as Entidad) : null);
  if (!destino) throw new ErrorValidacion(undefined, { entidad: "Elija a qué entidad lo envía." });
  return { pdf: await documentoDelOficio(q, destino), nombreArchivo: nombreDelArchivo(q) };
}

/** El oficio de un reporte derivado, para quien lo reportó (HU-QUE-07 CA3). Sin derivación: 404. */
export async function oficioDeLaQueja(id: string) {
  const q = await buscarParaGestion(id);
  if (!q?.expediente) throw new ErrorNoEncontrado();
  return { pdf: await documentoDelOficio(q, q.expediente.entidad), nombreArchivo: nombreDelArchivo(q) };
}
