import { manejar } from "@/compartido/manejar";
import { constanciaDeReclamo } from "@/modulos/aportes/aplicacion/reclamos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La constancia del reclamo en PDF, solo para la casa que lo envió (HU-COB-03, AC-7). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { pdf, nombreArchivo } = await constanciaDeReclamo(sesion, (await params).id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
