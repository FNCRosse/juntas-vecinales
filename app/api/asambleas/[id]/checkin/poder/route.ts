import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { validarPoderDeVoto } from "@/modulos/asambleas/aplicacion/checkin";

const esquema = z.object({ delegacionId: z.string().min(1) });

/** Valida un poder en la puerta: la casa del titular pasa a contar para el quórum (HU-ASA-07 CA1, CA2). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { delegacionId } = esquema.parse(await leerJson(peticion));
  return Response.json(await validarPoderDeVoto(sesion, (await params).id, delegacionId));
});
