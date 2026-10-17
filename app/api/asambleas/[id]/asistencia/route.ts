import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { cancelarAsistencia, confirmarAsistencia } from "@/modulos/asambleas/aplicacion/convocatorias";

type Contexto = { params: Promise<{ id: string }> };

/** El vecino confirma la asistencia de su casa a la asamblea (HU-ASA-02 CA1). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await confirmarAsistencia(sesion, (await params).id));
});

/** El vecino cambia su respuesta antes del plazo: su casa ya no asistirá (HU-ASA-02 CA3). */
export const DELETE = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await cancelarAsistencia(sesion, (await params).id));
});
