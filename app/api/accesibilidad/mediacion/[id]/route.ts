import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarEstadoApoyo } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  estado: z.enum(["EN_ATENCION", "ATENDIDA"], { error: "Elija el estado nuevo." }),
});

/** La directiva o el mediador cambia el estado de atención de un pedido (HU-ACC-04 CA3). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { estado } = esquema.parse(await leerJson(peticion));
  const actor = { usuarioId: sesion.usuarioId, nombre: sesion.nombreCompleto, roles: sesion.roles };
  return Response.json(await cambiarEstadoApoyo(actor, (await params).id, estado));
});
