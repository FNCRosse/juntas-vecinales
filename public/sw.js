// Service worker (FRONTEND.md §6), escrito a mano: guarda la pantalla de consulta de la garita y la de cobros en
// efectivo guardados de la directiva, con sus archivos, para abrirlas sin internet. Los datos no van aquí: la lista de
// casas y la cola de cobros van en IndexedDB.
const CACHE = "sin-conexion-v1";
const PANTALLAS = ["/garita/consultar", "/directiva/cobros/guardados"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const pantalla = request.mode === "navigate" && PANTALLAS.includes(url.pathname);
  if (!pantalla && !url.pathname.startsWith("/_next/static/")) return;
  // Primero la red; sin red, lo último guardado.
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          evento.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(pantalla ? url.pathname : request, copia)),
          );
        }
        return respuesta;
      })
      .catch(() =>
        caches.match(pantalla ? url.pathname : request).then((guardada) => guardada ?? Response.error()),
      ),
  );
});
