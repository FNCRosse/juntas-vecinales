// Service worker de la garita (FRONTEND.md §6), escrito a mano: guarda la pantalla de consulta y
// sus archivos para abrirla sin internet. La lista de casas no va aquí: va en IndexedDB.
const CACHE = "garita-v1";

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
  const pantalla = request.mode === "navigate" && url.pathname === "/garita/consultar";
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
