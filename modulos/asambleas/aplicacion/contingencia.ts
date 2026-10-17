// @HU-ASA-05
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, horaCorta, visperaALasOchoPm } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { vecinosDeLaComunidad } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { aDto, proximaAsamblea, type AsambleaDto } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  admiteContingencia,
  type Decision,
  prepararContingencia,
} from "@/modulos/asambleas/dominio/contingencia";
import {
  buscarAsamblea,
  convertirEnInformativa,
  reprogramarAsamblea,
} from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";

const MENSAJES: Record<"estado" | "antes_del_corte" | "alcanza", string> = {
  estado: "Esta asamblea ya no admite esa decisión.",
  antes_del_corte: "Todavía no llegó el plazo para confirmar. Podrá decidir cuando cierre.",
  alcanza: "El quórum sí alcanza: no hace falta reprogramar ni cambiar la asamblea.",
};

/**
 * El caso a resolver en DIR-ASA-01: la próxima asamblea, si llegó su corte y el quórum no alcanza (HU-ASA-05).
 * Devuelve null cuando no hay nada que decidir.
 */
export async function casoSinQuorum(sesion: SesionDto, ahora = new Date()): Promise<AsambleaDto | null> {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const proxima = await proximaAsamblea(sesion, ahora);
  if (!proxima) return null;
  const admision = admiteContingencia(
    {
      estado: proxima.estado,
      alcanza: proxima.quorum.alcanza,
      confirmacionesHasta: new Date(proxima.confirmacionesHasta),
    },
    ahora,
  );
  return admision === "si" ? proxima : null;
}

/**
 * La directiva decide qué hacer sin quórum (HU-ASA-05): reprogramar (CA1, CA2: nueva fecha y aviso masivo) o
 * convertir en sesión informativa (CA3: se avisa que no habrá votaciones ni acuerdos). Todo en una
 * transacción con su auditoría (AC-6). Repetir la misma decisión no avisa dos veces (AC-5).
 */
export async function registrarContingencia(
  sesion: SesionDto,
  asambleaId: string,
  datos: { decision: Decision; nuevaFechaHora: Date | null },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const errores = prepararContingencia(datos, ahora);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const fila = await buscarAsamblea(asambleaId);
  if (!fila || !fila.asamblea) throw new ErrorNoEncontrado();

  // La misma decisión ya registrada no se repite ni se avisa de nuevo.
  if (datos.decision === "INFORMATIVA" && fila.estado === "INFORMATIVA") {
    return { asamblea: aDto(fila), registrada: false };
  }
  if (
    datos.decision === "REPROGRAMAR" &&
    fila.estado === "REPROGRAMADA" &&
    datos.nuevaFechaHora?.getTime() === fila.fechaHora.getTime()
  ) {
    return { asamblea: aDto(fila), registrada: false };
  }

  const antes = aDto(fila);
  const admision = admiteContingencia(
    {
      estado: fila.estado,
      alcanza: antes.quorum.alcanza,
      confirmacionesHasta: fila.asamblea.confirmacionesHasta,
    },
    ahora,
  );
  if (admision !== "si") throw new ErrorReglaNegocio(MENSAJES[admision]);

  const nueva = datos.decision === "REPROGRAMAR" ? datos.nuevaFechaHora : null;
  const avisados = await prisma.$transaction(async (tx) => {
    if (nueva) {
      await reprogramarAsamblea(tx, asambleaId, {
        fechaHora: nueva,
        confirmacionesHasta: visperaALasOchoPm(nueva),
      });
    } else {
      await convertirEnInformativa(tx, asambleaId);
    }
    const destinatarios = await vecinosDeLaComunidad(tx);
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "ASAMBLEAS" as const,
        titulo: nueva ? "Asamblea reprogramada" : "La asamblea será una sesión informativa",
        texto: nueva
          ? `La asamblea pasó al ${fechaLarga(nueva)}, ${horaCorta(nueva)}, en ${fila.lugar}. Confirme su asistencia en la app.`
          : `La reunión del ${fechaLarga(fila.fechaHora)} será solo informativa: no se votará ni se tomarán acuerdos.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: nueva ? "reprogramar_asamblea" : "convertir_en_informativa",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: { estado: fila.estado, fechaHora: fila.fechaHora, confirmados: antes.quorum.confirmados },
        despues: { estado: nueva ? "REPROGRAMADA" : "INFORMATIVA", fechaHora: nueva ?? fila.fechaHora },
      },
      tx,
    );
    return destinatarios.length;
  });

  const actualizada = await buscarAsamblea(asambleaId);
  return { asamblea: aDto(actualizada!), registrada: true, avisados };
}
