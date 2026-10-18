// @HU-ASA-13
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { cierreDeAgenda } from "@/modulos/asambleas/aplicacion/convocatorias";
import { type DatosPropuesta, prepararPropuesta } from "@/modulos/asambleas/dominio/propuesta";
import { buscarAsamblea } from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";
import {
  crearPropuesta,
  propuestaPorIdOperacion,
  propuestasDe,
  propuestasDeAutor,
} from "@/modulos/asambleas/infraestructura/repositorioPropuestas";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

type Fila = NonNullable<Awaited<ReturnType<typeof propuestaPorIdOperacion>>>;

const aDto = (p: Fila) => ({
  id: p.id,
  titulo: p.titulo,
  justificacion: p.justificacion,
  estado: p.estado,
  motivoDecision: p.motivoDecision,
  enviadaEn: p.creadaEn.toISOString(),
});

export type PropuestaDto = ReturnType<typeof aDto>;

/**
 * El vecino propone un tema para la agenda (HU-ASA-13): título y una justificación breve antes del cierre de
 * la agenda (CA1); queda pendiente de revisión para la directiva (CA2). Repetir el mismo `idOperacion` devuelve
 * la ya enviada (AC-5); se audita en la misma transacción (AC-6).
 */
export async function proponerTema(
  sesion: SesionDto,
  asambleaId: string,
  datos: DatosPropuesta & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const { errores, propuesta } = prepararPropuesta(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await propuestaPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar una propuesta ajena con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { propuesta: aDto(previa), creada: false };
  }

  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) {
    throw new ErrorReglaNegocio(
      "No encontramos su vivienda en el padrón. Pida ayuda a la administración para proponer un tema.",
    );
  }
  const fila = await buscarAsamblea(asambleaId);
  if (!fila) throw new ErrorNoEncontrado();
  if (fila.estado !== "PUBLICADA" && fila.estado !== "REPROGRAMADA") {
    throw new ErrorReglaNegocio("Esta reunión no recibe propuestas para la agenda.");
  }
  if (ahora.getTime() > cierreDeAgenda(fila.fechaHora).getTime()) {
    throw new ErrorReglaNegocio("Ya cerró la agenda de esta asamblea: no se reciben más propuestas.");
  }

  const creada = await prisma.$transaction(async (tx) => {
    const nueva = await crearPropuesta(tx, {
      idOperacion: datos.idOperacion,
      convocatoriaId: asambleaId,
      autorId: sesion.usuarioId,
      predioId: predio.id,
      ...propuesta,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "proponer_tema",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { propuestaId: nueva.id, titulo: propuesta.titulo },
      },
      tx,
    );
    return nueva;
  });
  return { propuesta: aDto(creada), creada: true };
}

/** Lo que propuso el propio vecino en esa asamblea, con su estado (para que sepa cómo va). */
export async function misPropuestas(sesion: SesionDto, asambleaId: string): Promise<PropuestaDto[]> {
  exigirRol(sesion, ...ROLES_VECINO);
  return (await propuestasDeAutor(asambleaId, sesion.usuarioId)).map(aDto);
}

/**
 * La bandeja de la directiva (DIR-ASA-05, HU-ASA-13 CA2): las propuestas de la asamblea por fecha de envío, con
 * quién las envió y su vivienda.
 */
export async function bandejaDePropuestas(sesion: SesionDto, asambleaId: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const filas = await propuestasDe(asambleaId);
  const [autores, casas] = await Promise.all([
    nombresDe(filas.map((p) => p.autorId)),
    casasDe(filas.map((p) => p.predioId)),
  ]);
  return filas.map((p) => ({
    ...aDto(p),
    quien: autores.get(p.autorId) ?? "",
    vivienda: casas.get(p.predioId)?.vivienda ?? "",
  }));
}
