// @HU-ASA-15
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorValidacion } from "@/compartido/errores";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { avisarALaComunidad } from "./avisarComunidad";
import {
  type DatosComunicado,
  ordenarNoticias,
  prepararComunicado,
} from "@/modulos/transparencia/dominio/comunicado";
import {
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
});

export type NoticiaDto = ReturnType<typeof aDto>;

/**
 * Publica un comunicado a toda la comunidad (HU-ASA-15 CA1): queda en el feed, es inalterable y avisa a
 * cada vecino activo en el centro de avisos (CA2), todo en una transacción (AC-6, ADR-006). Repetir el
 * mismo `idOperacion` devuelve lo ya publicado sin publicar ni avisar otra vez (AC-5).
 */
export async function publicarComunicado(
  sesion: SesionDto,
  datos: DatosComunicado & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const { errores, comunicado } = prepararComunicado(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await buscarPorIdOperacion(datos.idOperacion);
  if (previa) return { comunicado: aDto(previa), creado: false };

  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearComunicado(tx, {
      ...comunicado,
      idOperacion: datos.idOperacion,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
    });
    const avisados = await avisarALaComunidad(
      { tipo: "NOTICIAS", titulo: comunicado.titulo, texto: comunicado.cuerpo },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_comunicado",
        entidad: "Comunicado",
        entidadId: fila.id,
        antes: null,
        despues: { titulo: comunicado.titulo, urgencia: comunicado.urgencia, avisados },
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
  const filas = await listarComunicados();
  return ordenarNoticias(
    filas.map((fila) => ({ fila, urgencia: aDto(fila).urgencia, fechaPublicacion: fila.fechaPublicacion })),
  ).map(({ fila }) => aDto(fila));
}

/** Las últimas noticias que se ven en el inicio del vecino (VEC-ACC-09). */
export async function ultimasNoticias(sesion: SesionDto, cantidad: number) {
  return (await verNoticias(sesion)).slice(0, cantidad);
}
