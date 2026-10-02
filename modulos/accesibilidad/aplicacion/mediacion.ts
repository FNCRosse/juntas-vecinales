// @HU-ACC-04
import { prisma } from "@/compartido/bd/cliente";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaPedidoAyuda } from "@/compartido/notificaciones/plantillas";
import {
  ESTADOS_APOYO,
  type EstadoApoyo,
  MODOS_APOYO,
  type ModoApoyo,
  numeroDePedido,
  puedePasarA,
  ROLES_QUE_ATIENDEN,
} from "@/modulos/accesibilidad/dominio/canalMediacionHumana";
import {
  buscarSolicitud,
  crearSolicitud,
  guardarEstado,
  solicitudesDe,
  solicitudesParaAtender,
} from "@/modulos/accesibilidad/infraestructura/repositorioApoyo";

export { ESTADOS_APOYO, MODOS_APOYO };
export type { EstadoApoyo, ModoApoyo };

// Quien llama compone los datos de la persona (app/ con identidad): accesibilidad no lee identidad.
type Mediador = { usuarioId: string; nombre: string; telefono: string | null };
type Actor = { usuarioId: string; nombre: string; roles: string[] };

const aDto = (s: Awaited<ReturnType<typeof solicitudesDe>>[number]) => ({
  id: s.id,
  numero: numeroDePedido(s.numero),
  quien: s.quien,
  pantalla: s.pantalla,
  modo: MODOS_APOYO[s.modo].opcion,
  detalle: s.detalle,
  estado: s.estado,
  estadoTexto:
    s.estado === "ATENDIDA" && s.atendidaPor ? `Atendido por ${s.atendidaPor}` : ESTADOS_APOYO[s.estado],
  fecha: s.creadaEn.toISOString(),
});

/**
 * Pide ayuda a una persona (HU-ACC-04 CA1): queda registrado como pendiente (CA3) y se avisa a los
 * mediadores de turno con el nombre y la pantalla donde se quedó (CA2).
 */
export async function solicitarApoyo(
  datos: { usuarioId: string; quien: string; pantalla: string; modo: ModoApoyo; detalle?: string },
  mediadores: Mediador[],
) {
  const solicitud = await prisma.$transaction(async (tx) => {
    const creada = await crearSolicitud(tx, datos);
    for (const mediador of mediadores) {
      await encolarAviso(
        {
          destinatarioId: mediador.usuarioId,
          titulo: `Pedido de ayuda ${numeroDePedido(creada.numero)}`,
          texto: `${datos.quien} se quedó en «${datos.pantalla}». Prefiere: ${MODOS_APOYO[datos.modo].opcion.toLowerCase()}.`,
          whatsapp: mediador.telefono
            ? {
                telefono: mediador.telefono,
                ...plantillaPedidoAyuda(datos.quien, datos.pantalla, MODOS_APOYO[datos.modo].opcion),
              }
            : undefined,
        },
        tx,
      );
    }
    return creada;
  });
  return {
    ...aDto(solicitud),
    atiende: mediadores[0]?.nombre ?? null,
    promesa: MODOS_APOYO[datos.modo].promesa,
  };
}

/** Los pedidos de la propia persona, con su estado (VEC-AYU-03). */
export async function misSolicitudes(usuarioId: string) {
  return (await solicitudesDe(usuarioId)).map(aDto);
}

function exigirQueAtiende(actor: Actor) {
  if (!actor.roles.some((rol) => ROLES_QUE_ATIENDEN.includes(rol))) throw new ErrorNoAutorizado();
}

/** Bandeja de la mediación (DIR-AYU-01): primero lo pendiente. */
export async function solicitudesPorAtender(actor: Actor) {
  exigirQueAtiende(actor);
  return (await solicitudesParaAtender()).map(aDto);
}

/** Cambia el estado de atención; solo avanza (CA3). */
export async function cambiarEstadoApoyo(actor: Actor, id: string, estado: EstadoApoyo) {
  exigirQueAtiende(actor);
  const solicitud = await buscarSolicitud(id);
  if (!solicitud) throw new ErrorNoEncontrado();
  if (!puedePasarA(solicitud.estado, estado)) {
    throw new ErrorReglaNegocio(
      `Este pedido ya está «${ESTADOS_APOYO[solicitud.estado].toLowerCase()}». Recargue la página.`,
    );
  }
  return aDto(await guardarEstado(id, estado, actor.nombre));
}
