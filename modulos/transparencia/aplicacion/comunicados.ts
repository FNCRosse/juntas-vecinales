// @HU-ASA-15
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { avisarALaComunidad } from "./avisarComunidad";
import {
  type DatosComunicado,
  ordenarNoticias,
  prepararComunicado,
} from "@/modulos/transparencia/dominio/comunicado";
import {
  buscarComunicado,
  buscarPorIdOperacion,
  crearComunicado,
  listarComunicados,
} from "@/modulos/transparencia/infraestructura/repositorioPublicaciones";

type Fila = NonNullable<Awaited<ReturnType<typeof buscarPorIdOperacion>>>;

const aDto = (p: Fila) => ({
  id: p.id,
  titulo: p.titulo,
  cuerpo: p.comunicado?.cuerpo ?? "",
  urgencia: p.comunicado?.urgencia ?? ("INFORMATIVO" as const),
  autor: p.autor,
  fecha: p.fechaPublicacion.toISOString(),
  /** El comunicado que este corrige, si es una corrección. */
  corrigeAId: p.corrigeAId,
  /** La corrección publicada de este comunicado: los vecinos ya no ven este, sino ese. */
  corregidoPorId: p.correcciones[0]?.id ?? null,
});

export type NoticiaDto = ReturnType<typeof aDto>;

/**
 * Publica un comunicado a toda la comunidad (HU-ASA-15 CA1): queda en el feed, es inalterable y avisa a
 * cada vecino activo en el centro de avisos (CA2), todo en una transacción (AC-6, ADR-006). Repetir el
 * mismo `idOperacion` devuelve lo ya publicado sin publicar ni avisar otra vez (AC-5).
 */
export async function publicarComunicado(
  sesion: SesionDto,
  datos: DatosComunicado & { idOperacion: string; corrigeAId?: string | null },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const { errores, comunicado } = prepararComunicado(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await buscarPorIdOperacion(datos.idOperacion);
  if (previa) return { comunicado: aDto(previa), creado: false };

  // Una corrección reemplaza al comunicado para los vecinos; uno ya corregido se corrige desde su corrección.
  const corrigeAId = datos.corrigeAId ?? null;
  if (corrigeAId) {
    const original = await buscarComunicado(corrigeAId);
    if (!original) throw new ErrorNoEncontrado();
    if (original.correcciones.length) {
      throw new ErrorReglaNegocio("Ese comunicado ya tiene una corrección: corrija la más reciente.");
    }
  }

  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearComunicado(tx, {
      ...comunicado,
      idOperacion: datos.idOperacion,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
      corrigeAId,
    });
    const avisados = await avisarALaComunidad(
      {
        tipo: "NOTICIAS",
        titulo: corrigeAId ? `Corrección: ${comunicado.titulo}` : comunicado.titulo,
        texto: comunicado.cuerpo,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_comunicado",
        entidad: "Comunicado",
        entidadId: fila.id,
        antes: null,
        despues: { titulo: comunicado.titulo, urgencia: comunicado.urgencia, corrigeAId, avisados },
      },
      tx,
    );
    return fila;
  });
  return { comunicado: aDto(creada), creado: true };
}

/** El feed comunitario: los urgentes primero y los más nuevos arriba (HU-ASA-15 CA3). */
export async function verNoticias(sesion: SesionDto): Promise<NoticiaDto[]> {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  // Un comunicado corregido ya no se muestra: su corrección lo reemplaza.
  const filas = (await listarComunicados()).filter((f) => f.correcciones.length === 0);
  return ordenarNoticias(
    filas.map((fila) => ({ fila, urgencia: aDto(fila).urgencia, fechaPublicacion: fila.fechaPublicacion })),
  ).map(({ fila }) => aDto(fila));
}

/** Las últimas noticias que se ven en el inicio del vecino (VEC-ACC-09). */
export async function ultimasNoticias(sesion: SesionDto, cantidad: number) {
  return (await verNoticias(sesion)).slice(0, cantidad);
}

/**
 * Todos los comunicados para que la directiva los administre (DIR-ASA-14): los más nuevos arriba, también los corregidos, cada
 * uno con su corrección si la tiene.
 */
export async function comunicadosDeLaDirectiva(sesion: SesionDto): Promise<NoticiaDto[]> {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  return (await listarComunicados()).map(aDto);
}

/** Un comunicado publicado, para verlo o corregirlo. */
export async function verComunicado(sesion: SesionDto, id: string): Promise<NoticiaDto> {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const fila = await buscarComunicado(id);
  if (!fila) throw new ErrorNoEncontrado();
  return aDto(fila);
}
