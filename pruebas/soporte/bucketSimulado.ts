import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { firmarUrl } from "@/compartido/archivos/firma";

// Bucket privado en memoria que se comporta como R2 ante una URL firmada (docs/PRUEBAS.md §6):
// recalcula la firma, rechaza la caducada y no responde a nadie el listado del bucket.

export type BucketSimulado = {
  origen: string;
  ahora: Date;
  objetos: Map<string, { tipo: string; contenido: Buffer }>;
  cerrar(): Promise<void>;
};

const leerCuerpo = (req: IncomingMessage) =>
  new Promise<Buffer>((resolver) => {
    const partes: Buffer[] = [];
    req.on("data", (p: Buffer) => partes.push(p)).on("end", () => resolver(Buffer.concat(partes)));
  });

function firmaValida(req: IncomingMessage, url: URL, host: string, secreto: string, ahora: Date) {
  const q = url.searchParams;
  const amz = q.get("X-Amz-Date");
  const vigencia = Number(q.get("X-Amz-Expires"));
  const firmadas = q.get("X-Amz-SignedHeaders")?.split(";") ?? [];
  const idClave = q.get("X-Amz-Credential")?.split("/")[0];
  if (!amz || !vigencia || !idClave || !q.get("X-Amz-Signature")) return "AccessDenied";

  const emitida = new Date(
    `${amz.slice(0, 4)}-${amz.slice(4, 6)}-${amz.slice(6, 8)}T${amz.slice(9, 11)}:${amz.slice(11, 13)}:${amz.slice(13, 15)}Z`,
  );
  if (ahora.getTime() > emitida.getTime() + vigencia * 1000) return "Request has expired";

  const cabeceras = Object.fromEntries(
    firmadas.filter((n) => n !== "host").map((n) => [n, String(req.headers[n] ?? "")]),
  );
  const esperada = firmarUrl(
    {
      metodo: req.method as "GET" | "PUT",
      host,
      ruta: decodeURIComponent(url.pathname),
      region: "auto",
      vigenciaSegundos: vigencia,
      ahora: emitida,
      cabeceras,
    },
    { idClave, secreto },
  );
  return new URL(esperada).searchParams.get("X-Amz-Signature") === q.get("X-Amz-Signature")
    ? null
    : "SignatureDoesNotMatch";
}

export async function abrirBucketSimulado(
  host: string,
  bucket: string,
  secreto: string,
): Promise<BucketSimulado> {
  const objetos: BucketSimulado["objetos"] = new Map();
  const estado = { ahora: new Date() };
  const servidor: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://local");
    const [, nombreBucket, ...resto] = url.pathname.split("/");
    const clave = decodeURIComponent(resto.join("/"));
    const cuerpo = await leerCuerpo(req);
    const negar = (motivo: string) => res.writeHead(403).end(motivo);

    if (nombreBucket !== bucket) return res.writeHead(404).end("NoSuchBucket");
    // Listar el bucket (GET /bucket o /bucket/): no hay URL ni credencial pública que lo permita.
    if (!clave) return negar("AccessDenied");
    const problema = firmaValida(req, url, host, secreto, estado.ahora);
    if (problema) return negar(problema);

    if (req.method === "PUT") {
      objetos.set(clave, { tipo: String(req.headers["content-type"]), contenido: cuerpo });
      return res.writeHead(200).end();
    }
    const objeto = objetos.get(clave);
    if (!objeto) return res.writeHead(404).end("NoSuchKey");
    res.writeHead(200, { "content-type": objeto.tipo }).end(objeto.contenido);
  });
  await new Promise<void>((resolver) => servidor.listen(0, "127.0.0.1", resolver));
  const { port } = servidor.address() as AddressInfo;
  return {
    origen: `http://127.0.0.1:${port}`,
    objetos,
    get ahora() {
      return estado.ahora;
    },
    set ahora(fecha: Date) {
      estado.ahora = fecha;
    },
    cerrar: () => new Promise((resolver) => servidor.close(() => resolver())),
  };
}
