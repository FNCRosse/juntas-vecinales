import { manejar } from "@/compartido/manejar";
import { pdfDelRecibo } from "@/modulos/aportes/aplicacion/recibos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * El recibo oficial en PDF (HU-COB-12): la directiva ve cualquiera; la casa, solo los suyos y ya enviados (404 si es de
 * otra, AC-7). Por defecto se abre en la pestaña, listo para imprimir; con `?descargar=1` se guarda como archivo.
 */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { pdf, nombreArchivo } = await pdfDelRecibo(sesion, (await params).id);
  const descargar = new URL(peticion.url).searchParams.get("descargar") === "1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${descargar ? "attachment" : "inline"}; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
