import { manejar } from "@/compartido/manejar";
import { constanciaDePago } from "@/modulos/aportes/aplicacion/pagos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La constancia de envío del pago, en PDF, solo para la casa que lo mandó (HU-COB-08, AC-7). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { pdf, nombreArchivo } = await constanciaDePago(sesion, (await params).id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
});
