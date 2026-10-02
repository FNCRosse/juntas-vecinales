import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { resolverSolicitudArco } from "@/modulos/identidad/aplicacion/arco";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ aprobar: z.boolean(), motivo: z.string().max(500).optional() });

/** El administrador aprueba o rechaza una solicitud de privacidad (HU-GAR-16 CA3). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const decision = esquema.parse(await leerJson(peticion));
  return Response.json(await resolverSolicitudArco(sesion, (await params).id, decision));
});
