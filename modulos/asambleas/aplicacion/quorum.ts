// @HU-ASA-04
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { fechaEnFrase } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { directivaParaAvisar } from "@/modulos/identidad/aplicacion/barrio";
import { aDto } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  asambleasEnElCorte,
  reclamarAvisoDeCorte,
} from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";

/**
 * Tarea del worker al llegar el plazo de corte (HU-ASA-04 CA3): avisa a la directiva si el quórum
 * proyectado alcanza o no, una sola vez por asamblea. Si no alcanza, el aviso le recuerda que debe decidir
 * entre reprogramar o hacer una sesión informativa (HU-ASA-05). Idempotente: el reclamo del aviso es un
 * UPDATE condicionado, así dos ejecuciones a la vez no duplican el aviso. Devuelve cuántos avisó.
 */
export async function avisarCorteDeQuorum(ahora = new Date()): Promise<number> {
  const vencidas = await asambleasEnElCorte(ahora);
  let avisadas = 0;
  for (const fila of vencidas) {
    const asamblea = aDto(fila);
    const { quorum } = asamblea;
    const destinatarios = await directivaParaAvisar();
    const reclamada = await prisma.$transaction(async (tx) => {
      if (!(await reclamarAvisoDeCorte(tx, fila.id, ahora))) return false;
      await encolarAvisos(
        destinatarios.map((destinatarioId) => ({
          destinatarioId,
          tipo: "ASAMBLEAS" as const,
          titulo: `Quórum proyectado: ${quorum.confirmados} de ${quorum.padronTotal} casas`,
          texto: `Asamblea del ${fechaEnFrase(fila.fechaHora)}. ${quorum.texto}${
            quorum.alcanza ? "" : " Decida si la reprograma o la convierte en sesión informativa."
          }`,
        })),
        tx,
      );
      await registrarAuditoria(
        {
          actorId: null,
          accion: "avisar_corte_de_quorum",
          entidad: "Asamblea",
          entidadId: fila.id,
          antes: null,
          despues: {
            confirmados: quorum.confirmados,
            alcanza: quorum.alcanza,
            avisados: destinatarios.length,
          },
        },
        tx,
      );
      return true;
    });
    if (reclamada) avisadas += 1;
  }
  return avisadas;
}
