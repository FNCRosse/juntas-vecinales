import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { abrirLasVotaciones } from "@/modulos/asambleas/aplicacion/checkin";

/** Abre las votaciones: solo con quórum definitivo; sin él se bloquean votos y acuerdos (HU-ASA-07 CA3). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await abrirLasVotaciones(sesion, (await params).id));
});
