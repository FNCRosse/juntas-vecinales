import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type ServerResponse } from "node:http";
import { ejecutarTareas } from "./ejecutor";

function responder(res: ServerResponse, estado: number, cuerpo: object) {
  res.writeHead(estado, { "content-type": "application/json; charset=utf-8" }).end(JSON.stringify(cuerpo));
}

function secretoValido(recibido: string | string[] | undefined, esperado: string | undefined) {
  if (!esperado || typeof recibido !== "string") return false;
  const resumen = (texto: string) => createHash("sha256").update(texto).digest();
  return timingSafeEqual(resumen(recibido), resumen(esperado));
}

/** Servidor HTTP del worker: GET /salud y POST /tareas/ejecutar (docs/BACKEND.md §8). */
export function crearServidor(secreto = process.env.SECRETO_WORKER) {
  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/salud") return responder(res, 200, { estado: "ok" });

    if (req.method === "POST" && req.url === "/tareas/ejecutar") {
      if (!secretoValido(req.headers["x-secreto-worker"], secreto)) {
        return responder(res, 401, { error: "No autorizado" });
      }
      try {
        return responder(res, 200, await ejecutarTareas());
      } catch (error) {
        console.error("Falló la ejecución de tareas", error);
        return responder(res, 500, { error: "La ejecución falló" });
      }
    }

    responder(res, 404, { error: "No encontrado" });
  });
}

if (require.main === module) {
  const puerto = Number(process.env.PORT ?? 10000);
  crearServidor().listen(puerto, () => console.log(`Worker escuchando en el puerto ${puerto}`));
}
