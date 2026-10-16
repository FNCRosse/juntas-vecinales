import { COOKIE_MODO_DISPOSITIVO, RUTA_PERFIL } from "./modo";

// Cambia entre vista normal y vista grande (modo Senior): lo aplica al instante en <html> y lo guarda
// en el perfil del servidor. Si no se pudo guardar, el modo se mantiene en este dispositivo con una
// cookie (nunca localStorage, ADR-004) y la función devuelve false para que la pantalla lo avise.
// Lo usan el botón "Vista grande" de la barra y la elección de la guía de primer uso.

const UN_ANIO_SEGUNDOS = 400 * 24 * 60 * 60;

export function aplicarModo(senior: boolean) {
  if (senior) document.documentElement.dataset.mode = "senior";
  else delete document.documentElement.dataset.mode;
}

export async function cambiarVista(senior: boolean): Promise<boolean> {
  aplicarModo(senior);
  let guardado = false;
  try {
    const respuesta = await fetch(RUTA_PERFIL, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modoSeniorActivo: senior }),
    });
    guardado = respuesta.ok;
  } catch {
    guardado = false;
  }
  document.cookie = guardado
    ? `${COOKIE_MODO_DISPOSITIVO}=; Path=/; Max-Age=0; SameSite=Lax`
    : `${COOKIE_MODO_DISPOSITIVO}=${senior ? "senior" : "normal"}; Path=/; Max-Age=${UN_ANIO_SEGUNDOS}; SameSite=Lax`;
  return guardado;
}
