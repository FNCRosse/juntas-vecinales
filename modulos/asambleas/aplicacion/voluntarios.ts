// @HU-ASA-09
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type DecisionVoluntariado,
  eximeDeCuota,
  prepararDecisionVoluntariado,
  prepararVoluntariado,
} from "@/modulos/asambleas/dominio/voluntariado";
import {
  buscarActividad,
  colaboracionDePredio,
} from "@/modulos/asambleas/infraestructura/repositorioActividades";
import {
  buscarVoluntariado,
  crearVoluntariado,
  decidirVoluntariado,
  voluntariadoDePredio,
  voluntariadoPorIdOperacion,
  voluntariosDe,
} from "@/modulos/asambleas/infraestructura/repositorioVoluntarios";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

type Fila = NonNullable<Awaited<ReturnType<typeof voluntariadoPorIdOperacion>>>;

const aDto = (v: Fila) => ({
  id: v.id,
  descripcion: v.descripcion,
  estado: v.estado,
  rolAsignado: v.rolAsignado,
  eximeDeCuota: eximeDeCuota(v.estado),
  ofrecidaEn: v.creadaEn.toISOString(),
});

export type VoluntariadoDto = ReturnType<typeof aDto>;

/**
 * Una casa ofrece su ayuda en una actividad que pide voluntarios (HU-ASA-09 CA1). Queda pendiente hasta que la
 * directiva la apruebe. Una casa no colabora y se ofrece a la vez. Repetir el mismo `idOperacion` devuelve el
 * ofrecimiento ya hecho (AC-5); se audita en la misma transacción (AC-6).
 */
export async function ofrecerAyuda(
  sesion: SesionDto,
  actividadId: string,
  datos: { descripcion: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previa = await voluntariadoPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar un ofrecimiento ajeno con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { voluntariado: aDto(previa), creado: false };
  }

  const { errores, descripcion } = prepararVoluntariado(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  const actividad = await buscarActividad(actividadId);
  if (!actividad?.evento) throw new ErrorNoEncontrado();
  if (!actividad.evento.pideVoluntarios) {
    throw new ErrorReglaNegocio("Esta actividad no pide voluntarios. Puede colaborar pagando.");
  }
  if (ahora.getTime() > actividad.fechaHora.getTime()) {
    throw new ErrorReglaNegocio("Esta actividad ya se realizó: no se reciben más ofrecimientos.");
  }
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) {
    throw new ErrorReglaNegocio(
      "No encontramos su vivienda en el padrón. Pida ayuda a la administración para ofrecer su ayuda.",
    );
  }
  if (await colaboracionDePredio(actividadId, predio.id)) {
    throw new ErrorReglaNegocio("Su casa ya registró su aporte a esta actividad.");
  }
  if (await voluntariadoDePredio(actividadId, predio.id)) {
    throw new ErrorReglaNegocio("Su casa ya ofreció su ayuda en esta actividad.");
  }

  const creado = await prisma.$transaction(async (tx) => {
    const fila = await crearVoluntariado(tx, {
      idOperacion: datos.idOperacion,
      convocatoriaId: actividadId,
      predioId: predio.id,
      autorId: sesion.usuarioId,
      descripcion,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "ofrecer_ayuda",
        entidad: "Actividad",
        entidadId: actividadId,
        antes: null,
        despues: { predioId: predio.id, descripcion },
      },
      tx,
    );
    return fila;
  });
  return { voluntariado: aDto(creado), creado: true };
}

/** El ofrecimiento de ayuda de la casa del vecino en esa actividad, o null si no se ofreció. */
export async function miVoluntariado(
  sesion: SesionDto,
  actividadId: string,
): Promise<VoluntariadoDto | null> {
  exigirRol(sesion, ...ROLES_VECINO);
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) return null;
  const fila = await voluntariadoDePredio(actividadId, predio.id);
  return fila ? aDto(fila) : null;
}

/** Los ofrecimientos de ayuda de la actividad, con quién se ofreció y su vivienda (DIR-ASA-12). */
export async function voluntariosDeLaActividad(sesion: SesionDto, actividadId: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const filas = await voluntariosDe(actividadId);
  const [autores, casas] = await Promise.all([
    nombresDe(filas.map((v) => v.autorId)),
    casasDe(filas.map((v) => v.predioId)),
  ]);
  return filas.map((v) => ({
    ...aDto(v),
    quien: autores.get(v.autorId) ?? "",
    vivienda: casas.get(v.predioId)?.vivienda ?? "",
  }));
}

/**
 * La directiva evalúa un ofrecimiento (HU-ASA-09 CA2): lo aprueba registrando el rol asignado, o no lo aprueba por
 * ahora. Aprobado, la casa queda exenta de la colaboración (CA3) y recibe el aviso. Todo en una transacción con su
 * auditoría (AC-6); repetir la misma decisión no avisa dos veces (AC-5).
 */
export async function evaluarVoluntariado(
  sesion: SesionDto,
  voluntariadoId: string,
  datos: { decision: DecisionVoluntariado; rol: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { errores, rol } = prepararDecisionVoluntariado(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  const voluntariado = await buscarVoluntariado(voluntariadoId);
  if (!voluntariado) throw new ErrorNoEncontrado();

  const estado = datos.decision === "APROBAR" ? ("APROBADO" as const) : ("NO_APROBADO" as const);
  if (voluntariado.estado === estado && voluntariado.rolAsignado === rol) {
    return { voluntariado: aDto(voluntariado), registrada: false };
  }
  if (voluntariado.estado !== "PENDIENTE") {
    throw new ErrorReglaNegocio("Este ofrecimiento ya tiene una decisión.");
  }

  await prisma.$transaction(async (tx) => {
    const registrada = await decidirVoluntariado(tx, {
      id: voluntariadoId,
      estado,
      rolAsignado: rol,
      decididoPor: sesion.usuarioId,
      ahora,
    });
    if (!registrada)
      throw new ErrorReglaNegocio("Otra persona de la directiva ya decidió sobre este ofrecimiento.");
    await encolarAviso(
      {
        destinatarioId: voluntariado.autorId,
        tipo: "ASAMBLEAS",
        titulo: estado === "APROBADO" ? "Su ayuda fue aprobada" : "Su ayuda no se aprobó por ahora",
        texto:
          estado === "APROBADO"
            ? `La directiva aprobó su ayuda como voluntaria: ${rol}. No paga la colaboración.`
            : "La directiva no pudo aprobar su ayuda por ahora. Si quiere, puede colaborar pagando.",
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "evaluar_voluntariado",
        entidad: "Voluntariado",
        entidadId: voluntariadoId,
        antes: { estado: voluntariado.estado },
        despues: { estado, rol },
      },
      tx,
    );
  });
  return { voluntariado: aDto((await buscarVoluntariado(voluntariadoId))!), registrada: true };
}
