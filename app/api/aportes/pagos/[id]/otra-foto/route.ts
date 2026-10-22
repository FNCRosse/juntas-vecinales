import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { enviarOtraFoto } from "@/modulos/aportes/aplicacion/pagos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({ archivoId: z.string() });

/**
 * La casa manda otra foto de un pago observado (HU-COB-10): el pago vuelve a revisión. Solo de un pago de su casa (404
 * si es de otra). Repetir la misma foto no avisa otra vez: `aplicado` dice si esta llamada fue la que lo devolvió.
 */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(
    await enviarOtraFoto(sesion, (await params).id, esquema.parse(await leerJson(peticion))),
  );
});
