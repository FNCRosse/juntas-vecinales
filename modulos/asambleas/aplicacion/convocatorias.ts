// @HU-ASA-01
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaEnFrase, fechaLarga, horaCorta, visperaALasOchoPm } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { totalDePredios, vecinosDeLaComunidad } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type DatosConvocatoria,
  prepararConvocatoria,
  quorumRequerido,
} from "@/modulos/asambleas/dominio/convocatoria";
import {
  buscarAsamblea,
  buscarPorIdOperacion,
  crearAsamblea,
  listarAsambleas,
} from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";

type Fila = NonNullable<Awaited<ReturnType<typeof buscarPorIdOperacion>>>;

const aDto = (c: Fila) => ({
  id: c.id,
  titulo: c.titulo,
  tipoAsamblea: c.asamblea?.tipoAsamblea ?? ("ORDINARIA" as const),
  fechaHora: c.fechaHora.toISOString(),
  lugar: c.lugar,
  motivo: c.motivo,
  estado: c.estado,
  confirmacionesHasta: (c.asamblea?.confirmacionesHasta ?? c.fechaHora).toISOString(),
  padronTotal: c.asamblea?.padronTotal ?? 0,
  quorumRequerido: c.asamblea?.quorumRequerido ?? 0,
  // Las confirmaciones (digitales y asistidas) llegan en HU-ASA-02/03; el quórum proyectado, en HU-ASA-04.
  confirmados: { digital: 0, asistida: 0, total: 0 },
});

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

/** La próxima asamblea a partir de ahora, o null si no hay (bloque del inicio, DIR-INI-01 / VEC-ACC-09). */
export async function proximaAsamblea(sesion: SesionDto, ahora = new Date()): Promise<AsambleaDto | null> {
  const futuras = (await verAsambleas(sesion)).filter(
    (a) => new Date(a.fechaHora).getTime() >= ahora.getTime(),
  );
  return futuras[0] ?? null;
}

/** Una asamblea por su id (afiche y detalle, HU-ASA-01 CA2). */
export async function verAsamblea(sesion: SesionDto, id: string): Promise<AsambleaDto> {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const fila = await buscarAsamblea(id);
  if (!fila) throw new ErrorNoEncontrado();
  return aDto(fila);
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
