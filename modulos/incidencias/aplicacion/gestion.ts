// @HU-QUE-05
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  type Admisibilidad,
  PRIORIDADES,
  prepararAdmisibilidad,
} from "@/modulos/incidencias/dominio/gestion";
import { CATEGORIAS, ESTADOS, lugarEnTexto, numeroVisible } from "@/modulos/incidencias/dominio/queja";
import { buscarParaGestion, cambiarSiSigueEn } from "@/modulos/incidencias/infraestructura/repositorioQuejas";
import { avisarAlDenunciante } from "./avisarDenunciante";
import { ANONIMO } from "./quejas";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
export { PRIORIDADES };

export const MENSAJE_YA_EVALUADA = "Otra persona de la directiva ya evaluó este reporte. Revise su estado.";

/**
 * El reporte completo para la directiva (DIR-QUE-02): lo que se reportó, dónde (con las coordenadas si
 * las hay), quién (o "Reporte anónimo"), las evidencias para revisarlas y lo decidido hasta ahora.
 */
export async function verQuejaParaGestion(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const q = await buscarParaGestion(id);
  if (!q) throw new ErrorNoEncontrado();
  const nombres = await nombresDe(
    [q.denuncianteId, q.registradaPor, q.evaluadaPor].filter((x): x is string => !!x),
  );
  const nombre = (id: string | null) => (id ? (nombres.get(id) ?? "Persona ya no registrada") : null);
  return {
    id: q.id,
    numero: numeroVisible(q.numero),
    categoria: CATEGORIAS[q.categoria],
    descripcion: q.descripcion,
    lugar: lugarEnTexto(q.manzana, q.referencia),
    coordenadas: q.latitud != null && q.longitud != null ? `${q.latitud}, ${q.longitud}` : null,
    quien: q.esAnonimo ? ANONIMO : nombre(q.denuncianteId),
    esAnonimo: q.esAnonimo,
    registradaPor: nombre(q.registradaPor),
    evidencias: q.evidencias.map((e, i) => ({
      id: e.archivoId,
      nombre: `${e.archivo.tipo.startsWith("video/") ? "Video" : "Foto"} ${i + 1}`,
    })),
    estado: q.estado,
    estadoTexto: ESTADOS[q.estado],
    fechaRegistro: q.fechaRegistro.toISOString(),
    prioridad: q.prioridad ? PRIORIDADES[q.prioridad] : null,
    evaluadaPor: nombre(q.evaluadaPor),
    motivoRechazo: q.motivoRechazo,
  };
}
export type QuejaGestionDto = Awaited<ReturnType<typeof verQuejaParaGestion>>;

/**
 * Califica la admisibilidad (HU-QUE-05): si procede, asigna prioridad y pasa a "En revisión" (CA2); si es
 * falso o difamatorio, pasa a "No procede" con su motivo (CA3). Se audita, y se avisa a quien reportó con
 * un tono que no castiga, en la misma transacción (AC-6).
 */
export async function evaluarAdmisibilidad(
  sesion: SesionDto,
  id: string,
  datos: Admisibilidad,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const q = await buscarParaGestion(id);
  if (!q) throw new ErrorNoEncontrado();
  const resultado = prepararAdmisibilidad(q.estado, datos);
  if ("yaEvaluada" in resultado) throw new ErrorConflicto(MENSAJE_YA_EVALUADA);
  if (Object.keys(resultado.errores).length) throw new ErrorValidacion(undefined, resultado.errores);
  const { cambio } = resultado;
  const numero = numeroVisible(q.numero);

  await prisma.$transaction(async (tx) => {
    const cambiada = await cambiarSiSigueEn(tx, id, "RECIBIDO", {
      ...cambio,
      evaluadaPor: sesion.usuarioId,
      fechaEvaluacion: ahora,
    });
    if (!cambiada) throw new ErrorConflicto(MENSAJE_YA_EVALUADA);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: cambio.estado === "EN_REVISION" ? "admitir_queja" : "rechazar_queja",
        entidad: "Queja",
        entidadId: id,
        antes: { estado: q.estado },
        despues: {
          estado: cambio.estado,
          ...(cambio.prioridad && { prioridad: cambio.prioridad }),
          ...(cambio.motivoRechazo && { motivo: cambio.motivoRechazo }),
        },
      },
      tx,
    );
    await avisarAlDenunciante(
      q,
      cambio.estado === "EN_REVISION"
        ? {
            titulo: "La directiva revisa su reporte",
            texto: `Su reporte ${numero} procede y está en revisión. Le avisaremos cuando haya una solución.`,
          }
        : {
            titulo: "Su reporte no procede",
            texto: `La directiva revisó su reporte ${numero} y no puede darle curso: ${cambio.motivoRechazo} Le pedimos usar los reportes solo para problemas reales del barrio. Si cree que es un error, pida ayuda a una persona.`,
          },
      tx,
    );
  });
  return verQuejaParaGestion(sesion, id);
}
