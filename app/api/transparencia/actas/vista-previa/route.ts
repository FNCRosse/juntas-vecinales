import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { vistaPreviaActa } from "@/modulos/transparencia/aplicacion/actas";
import { esquemaActa } from "../esquema";

/** "Ver cómo queda el PDF" antes de publicar (HU-ASA-11 CA2): no guarda nada. */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const pdf = await vistaPreviaActa(sesion, esquemaActa.parse(await leerJson(peticion)));
  return new Response(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "cache-control": "private, no-store" },
  });
});
