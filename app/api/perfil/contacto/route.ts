import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { solicitarRectificacion } from "@/modulos/identidad/aplicacion/arco";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  telefono: z.string().max(20, "El celular tiene 9 números."),
  detalle: z.string().max(500, "Escriba como mucho 500 letras.").optional(),
  sustentoId: z.string().optional(),
});

/** Pedir el cambio del número de WhatsApp: queda pendiente de verificación (HU-GAR-17 CA1). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { telefono, detalle, sustentoId } = esquema.parse(await leerJson(peticion));
  return Response.json(
    await solicitarRectificacion(sesion, { campo: "WHATSAPP", valor: telefono, detalle, sustentoId }),
    {
      status: 201,
    },
  );
});
