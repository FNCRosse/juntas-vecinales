import { generarPdf } from "@/compartido/archivos/pdf";
import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { aficheDeAsamblea, verAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";

/** El afiche A4 imprimible de la convocatoria, en PDF etiquetado (HU-ASA-01 CA2, CA3). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const afiche = aficheDeAsamblea(await verAsamblea(sesion, (await params).id));
  const pdf = await generarPdf(afiche);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${afiche.nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
