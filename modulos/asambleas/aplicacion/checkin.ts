// @HU-ASA-07
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { inicioDelDiaEnLima } from "@/compartido/fechas";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { buscarVecinos, casasDe } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { numeroDeConstancia } from "@/modulos/asambleas/dominio/delegacion";
import { quorumDefinitivo } from "@/modulos/asambleas/dominio/quorum";
import { buscarAsamblea } from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";
import {
  abrirVotaciones,
  checkInsDe,
  delegacionesDe,
  marcarPresente,
  validarPoder,
} from "@/modulos/asambleas/infraestructura/repositorioCheckIn";

const ROLES = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

async function asambleaDelDia(id: string) {
  const fila = await buscarAsamblea(id);
  if (!fila || !fila.asamblea) throw new ErrorNoEncontrado();
  if (fila.estado === "CERRADA") throw new ErrorReglaNegocio("Esta asamblea ya está cerrada.");
  return { fila, asamblea: fila.asamblea };
}

/** El pase de lista se abre el día de la asamblea (a las 0:00 de Lima): marcar a alguien antes no sería «in situ». */
function exigirDiaDeLaAsamblea(fechaHora: Date, ahora: Date) {
  if (ahora.getTime() < inicioDelDiaEnLima(fechaHora).getTime()) {
    throw new ErrorReglaNegocio("El pase de lista se abre el día de la asamblea.");
  }
}

/** Calcula el quórum definitivo de una asamblea: solo presentes y poderes validados (HU-ASA-07 CA2). */
async function quorumDeLaPuerta(convocatoriaId: string, padronTotal: number, requerido: number) {
  const [presentes, delegaciones] = await Promise.all([
    checkInsDe(convocatoriaId),
    delegacionesDe(convocatoriaId),
  ]);
  return {
    presentes,
    delegaciones,
    quorum: quorumDefinitivo({
      padronTotal,
      requerido,
      presentes: presentes.map((p) => p.predioId),
      poderes: delegaciones.filter((d) => d.validadaEn).map((d) => d.predioId),
    }),
  };
}

/**
 * El pase de lista (DIR-ASA-09): el quórum definitivo, si las votaciones están abiertas, quiénes ya llegaron y
 * los poderes por validar. Solo la directiva y los mediadores.
 */
export async function paseDeLista(sesion: SesionDto, asambleaId: string) {
  exigirRol(sesion, ...ROLES);
  const { fila, asamblea } = await asambleaDelDia(asambleaId);
  const { presentes, delegaciones, quorum } = await quorumDeLaPuerta(
    asambleaId,
    asamblea.padronTotal,
    asamblea.quorumRequerido,
  );
  const casas = await casasDe([...presentes.map((p) => p.predioId), ...delegaciones.map((d) => d.predioId)]);
  const titulares = await nombresDe(delegaciones.map((d) => d.titularId));
  return {
    asamblea: {
      id: fila.id,
      titulo: fila.titulo,
      fechaHora: fila.fechaHora.toISOString(),
      estado: fila.estado,
    },
    quorum,
    votaciones:
      fila.estado === "INFORMATIVA"
        ? ("SIN_VOTACION" as const)
        : asamblea.votacionesAbiertasEn
          ? ("ABIERTAS" as const)
          : ("CERRADAS" as const),
    llegaron: presentes.map((p) => ({
      predioId: p.predioId,
      nombre: casas.get(p.predioId)?.nombre ?? "",
      vivienda: casas.get(p.predioId)?.vivienda ?? "",
    })),
    poderes: delegaciones.map((d) => ({
      id: d.id,
      numero: numeroDeConstancia(d.numero),
      apoderado: d.apoderadoNombre,
      representaA: titulares.get(d.titularId) ?? casas.get(d.predioId)?.nombre ?? "",
      vivienda: casas.get(d.predioId)?.vivienda ?? "",
      validado: d.validadaEn !== null,
    })),
  };
}

export type PaseDeLista = Awaited<ReturnType<typeof paseDeLista>>;

/** Busca al vecino por nombre o DNI y dice si su casa ya fue marcada presente (HU-ASA-07 CA1). */
export async function buscarParaPaseDeLista(sesion: SesionDto, asambleaId: string, texto: string) {
  exigirRol(sesion, ...ROLES);
  await asambleaDelDia(asambleaId);
  const vecinos = await buscarVecinos(texto);
  const presentes = new Set((await checkInsDe(asambleaId)).map((p) => p.predioId));
  return vecinos.map((v) => ({ ...v, presente: presentes.has(v.predioId) }));
}

/** Marca a una casa como presente el día de la asamblea. Idempotente y auditada (HU-ASA-07 CA1, AC-5, AC-6). */
export async function marcarCasaPresente(
  sesion: SesionDto,
  asambleaId: string,
  predioId: string,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES);
  const { fila } = await asambleaDelDia(asambleaId);
  exigirDiaDeLaAsamblea(fila.fechaHora, ahora);
  if (!(await casasDe([predioId])).has(predioId)) throw new ErrorNoEncontrado();

  await prisma.$transaction(async (tx) => {
    const ya = await tx.checkInPresencial.findUnique({
      where: { convocatoriaId_predioId: { convocatoriaId: asambleaId, predioId } },
    });
    if (ya) return;
    await marcarPresente(tx, { convocatoriaId: asambleaId, predioId, acreditadoPor: sesion.usuarioId });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "marcar_presente",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { predioId },
      },
      tx,
    );
  });
  return paseDeLista(sesion, asambleaId);
}

/** Valida un poder en la puerta: desde ahí la casa del titular cuenta para el quórum (HU-ASA-07 CA1, CA2). */
export async function validarPoderDeVoto(
  sesion: SesionDto,
  asambleaId: string,
  delegacionId: string,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES);
  const { fila } = await asambleaDelDia(asambleaId);
  exigirDiaDeLaAsamblea(fila.fechaHora, ahora);
  const delegacion = (await delegacionesDe(asambleaId)).find((d) => d.id === delegacionId);
  if (!delegacion) throw new ErrorNoEncontrado();

  await prisma.$transaction(async (tx) => {
    const validada = await validarPoder(tx, {
      convocatoriaId: asambleaId,
      delegacionId,
      validadaPor: sesion.usuarioId,
      ahora,
    });
    if (!validada) return;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "validar_poder",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { constancia: numeroDeConstancia(delegacion.numero), predioId: delegacion.predioId },
      },
      tx,
    );
  });
  return paseDeLista(sesion, asambleaId);
}

/**
 * Abre las votaciones (HU-ASA-07 CA3): solo con quórum definitivo y si no es una sesión informativa. Sin
 * quórum no se registran votos ni acuerdos, y el mensaje dice cuánto falta. Repetirlo no las reabre (AC-5).
 */
export async function abrirLasVotaciones(sesion: SesionDto, asambleaId: string, ahora = new Date()) {
  exigirRol(sesion, ...ROLES);
  const { fila, asamblea } = await asambleaDelDia(asambleaId);
  if (fila.estado === "INFORMATIVA") {
    throw new ErrorReglaNegocio("Es una sesión informativa: no se registran votaciones ni acuerdos.");
  }
  exigirDiaDeLaAsamblea(fila.fechaHora, ahora);
  const { quorum } = await quorumDeLaPuerta(asambleaId, asamblea.padronTotal, asamblea.quorumRequerido);
  if (!quorum.alcanza) {
    throw new ErrorReglaNegocio(
      `Todavía no se puede votar: ${quorum.faltan === 1 ? "falta 1 casa" : `faltan ${quorum.faltan} casas`} para el quórum de ${quorum.requerido}. Mientras tanto no se pueden registrar votos ni acuerdos.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    if (!(await abrirVotaciones(tx, asambleaId, ahora))) return;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "abrir_votaciones",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: { presentes: quorum.presentes, poderes: quorum.poderes, total: quorum.total },
      },
      tx,
    );
  });
  return paseDeLista(sesion, asambleaId);
}
