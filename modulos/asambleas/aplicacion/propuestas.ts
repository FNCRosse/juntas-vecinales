// @HU-ASA-13 @HU-ASA-14
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaEnFrase } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { cierreDeAgenda } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  type DatosPropuesta,
  type DecisionPropuesta,
  prepararDecision,
  prepararPropuesta,
} from "@/modulos/asambleas/dominio/propuesta";
import { buscarAsamblea } from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";
import {
  buscarPropuesta,
  crearPropuesta,
  decidir,
  propuestaPorIdOperacion,
  propuestasDe,
  propuestasDeAutor,
  propuestasIncluidas,
  reabrir,
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

async function propuestaDeUnaAsambleaVigente(id: string, ahora: Date) {
  const propuesta = await buscarPropuesta(id);
  if (!propuesta) throw new ErrorNoEncontrado();
  const asamblea = await buscarAsamblea(propuesta.convocatoriaId);
  if (!asamblea) throw new ErrorNoEncontrado();
  if (ahora.getTime() > asamblea.fechaHora.getTime() || asamblea.estado === "CERRADA") {
    throw new ErrorReglaNegocio("La asamblea ya empezó: la agenda quedó cerrada.");
  }
  return { propuesta, asamblea };
}

/**
 * La directiva decide sobre una propuesta (HU-ASA-14 CA2): la incluye en la agenda o no la incluye con un motivo
 * breve, y el vecino recibe el resultado en sus avisos (HU-ASA-13 CA3). Todo en una transacción con su
 * auditoría (AC-6). Repetir la misma decisión no avisa dos veces (AC-5); para cambiarla hay que reabrirla.
 */
export async function decidirPropuesta(
  sesion: SesionDto,
  propuestaId: string,
  datos: { decision: DecisionPropuesta; motivo: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { errores, motivo } = prepararDecision(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  const { propuesta, asamblea } = await propuestaDeUnaAsambleaVigente(propuestaId, ahora);

  const estado = datos.decision === "INCLUIR" ? ("INCLUIDA" as const) : ("NO_INCLUIDA" as const);
  if (propuesta.estado === estado && propuesta.motivoDecision === motivo) {
    return { propuesta: aDto(propuesta), registrada: false };
  }
  if (propuesta.estado !== "PENDIENTE_REVISION") {
    throw new ErrorReglaNegocio(
      "Esta propuesta ya tiene una decisión. Use «Cambiar la decisión» para revisarla.",
    );
  }

  await prisma.$transaction(async (tx) => {
    const registrada = await decidir(tx, {
      id: propuestaId,
      estado,
      motivoDecision: motivo,
      decididaPor: sesion.usuarioId,
      ahora,
    });
    if (!registrada)
      throw new ErrorReglaNegocio("Otra persona de la directiva ya decidió sobre esta propuesta.");
    await encolarAviso(
      {
        destinatarioId: propuesta.autorId,
        tipo: "ASAMBLEAS",
        titulo:
          estado === "INCLUIDA"
            ? "Su propuesta fue incluida en la agenda"
            : "Su propuesta no se incluyó en la agenda",
        texto:
          estado === "INCLUIDA"
            ? `«${propuesta.titulo}» se tratará en la asamblea del ${fechaEnFrase(asamblea.fechaHora)}.`
            : `«${propuesta.titulo}» no se incluyó en la agenda. Motivo: ${motivo}.`,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "decidir_propuesta",
        entidad: "PropuestaAgenda",
        entidadId: propuestaId,
        antes: { estado: propuesta.estado },
        despues: { estado, motivo },
      },
      tx,
    );
  });
  const actual = await buscarPropuesta(propuestaId);
  return { propuesta: aDto(actual!), registrada: true };
}

/** «Cambiar la decisión» (DIR-ASA-05): la propuesta vuelve a pendiente de revisión y sale de la agenda. */
export async function cambiarDecision(sesion: SesionDto, propuestaId: string, ahora = new Date()) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { propuesta } = await propuestaDeUnaAsambleaVigente(propuestaId, ahora);
  if (propuesta.estado === "PENDIENTE_REVISION") return { propuesta: aDto(propuesta), reabierta: false };

  await prisma.$transaction(async (tx) => {
    if (!(await reabrir(tx, propuestaId))) return;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "reabrir_propuesta",
        entidad: "PropuestaAgenda",
        entidadId: propuestaId,
        antes: { estado: propuesta.estado, motivo: propuesta.motivoDecision },
        despues: { estado: "PENDIENTE_REVISION" },
      },
      tx,
    );
  });
  return { propuesta: aDto((await buscarPropuesta(propuestaId))!), reabierta: true };
}

export type PuntoDeAgenda = { titulo: string; origen: "DIRECTIVA" | "VECINAL"; quien?: string };

/**
 * La agenda publicada de la asamblea (HU-ASA-14 CA3): el motivo de la convocatoria y, anexadas solas, las
 * propuestas incluidas. La directiva ve quién propuso cada una; el vecino, solo el tema (privacidad).
 */
export async function agendaPublicada(sesion: SesionDto, asambleaId: string): Promise<PuntoDeAgenda[]> {
  exigirRol(sesion, ...ROLES_VECINO);
  const asamblea = await buscarAsamblea(asambleaId);
  if (!asamblea) throw new ErrorNoEncontrado();
  const incluidas = await propuestasIncluidas(asambleaId);
  const veAutores = sesion.roles.some((r) => (ROLES_DIRECTIVA as readonly string[]).includes(r));
  const autores = veAutores ? await nombresDe(incluidas.map((p) => p.autorId)) : new Map<string, string>();
  return [
    { titulo: asamblea.motivo, origen: "DIRECTIVA" },
    ...incluidas.map((p) => ({
      titulo: p.titulo,
      origen: "VECINAL" as const,
      ...(veAutores ? { quien: autores.get(p.autorId) ?? "" } : {}),
    })),
  ];
}
