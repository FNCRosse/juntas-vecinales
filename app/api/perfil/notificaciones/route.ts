import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarPreferencias } from "@/modulos/identidad/aplicacion/avisos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z
  .object({
    whatsapp: z.boolean(),
    pagos: z.boolean(),
    asambleas: z.boolean(),
    reportes: z.boolean(),
    garita: z.boolean(),
    noticias: z.boolean(),
  })
  .partial()
  .strict();

/** Cambiar qué avisos recibe (HU-GAR-18). Los de su cuenta y de seguridad no se pueden apagar (CA3). */
export const PUT = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await cambiarPreferencias(sesion, esquema.parse(await leerJson(peticion))));
});
