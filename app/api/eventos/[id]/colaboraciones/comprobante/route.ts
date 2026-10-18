import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { registrarComprobante } from "@/modulos/asambleas/aplicacion/actividades";

const esquema = z.object({ archivoId: z.string().min(1, "Suba de nuevo la foto de su comprobante.") });

/** Adjunta la foto del comprobante de un aporte anticipado (HU-ASA-08 CA2). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { archivoId } = esquema.parse(await leerJson(peticion));
  return Response.json(await registrarComprobante(sesion, (await params).id, archivoId));
});
