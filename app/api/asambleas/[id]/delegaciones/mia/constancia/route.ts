import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { constanciaDeDelegacion } from "@/modulos/asambleas/aplicacion/delegaciones";

/** La constancia de delegación del propio titular, en PDF etiquetado para la mesa (HU-ASA-06 CA2). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { pdf, nombreArchivo } = await constanciaDeDelegacion(sesion, (await params).id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
