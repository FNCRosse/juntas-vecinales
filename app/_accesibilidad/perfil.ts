import { cookies } from "next/headers";
import { cache } from "react";
import { COOKIE_MODO_DISPOSITIVO, COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { sesionActual } from "@/app/_sesion/sesion";

/**
 * Modo con el que se pinta <html> en el servidor, sin parpadeo (ADR-004). Lo último que eligió la
 * persona en este dispositivo y no se pudo guardar manda sobre lo guardado. Si la BD no responde,
 * la página se muestra igual con el perfil por defecto. Con sesión, el perfil es el de la cuenta
 * (el mismo desde cualquier dispositivo, R-10). Se lee una vez por petición (cache).
 */
export const modoSeniorAlRenderizar = cache(async (): Promise<boolean> => {
  const almacen = await cookies();
  const enDispositivo = almacen.get(COOKIE_MODO_DISPOSITIVO)?.value;
  if (enDispositivo === "senior" || enDispositivo === "normal") return enDispositivo === "senior";
  try {
    const usuarioId = (await sesionActual())?.usuarioId;
    return (await obtenerPerfil({ usuarioId, perfilId: almacen.get(COOKIE_PERFIL)?.value })).modoSeniorActivo;
  } catch (error) {
    console.error("No se pudo leer el perfil de accesibilidad", error);
    return false;
  }
});
