import { manejar } from "@/compartido/manejar";
import { marcarAvisoLeido } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** Marcar un aviso como leído (HU-GAR-20 CA2). Uno de otra persona responde 404 (AC-7). */
export const PATCH = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  await marcarAvisoLeido(sesion, (await params).id);
  return new Response(null, { status: 204 });
});
