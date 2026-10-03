import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { descargarActa } from "@/modulos/transparencia/aplicacion/actas";

/** El acta publicada en PDF etiquetado (HU-ASA-11 CA2). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { pdf, nombreArchivo } = await descargarActa(sesion, (await params).id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
