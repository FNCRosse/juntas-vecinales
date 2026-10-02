import { createHash, createHmac } from "node:crypto";

// Firma de URLs con AWS Signature V4 en la cadena de consulta, que es lo que acepta R2 por su API
// compatible con S3. Son pocas líneas con node:crypto: no hace falta el SDK de AWS (CLAUDE.md, regla 7).

export type Credenciales = { idClave: string; secreto: string };

export type PeticionAFirmar = {
  metodo: "GET" | "PUT";
  host: string;
  /** Ruta sin codificar, con la barra inicial: "/bucket/comprobantes/abc.jpg". */
  ruta: string;
  region: string;
  vigenciaSegundos: number;
  ahora: Date;
  /** Cabeceras que el cliente tendrá que enviar idénticas (además de host). */
  cabeceras?: Record<string, string>;
};

const sha256 = (texto: string) => createHash("sha256").update(texto).digest("hex");
const hmac = (clave: string | Buffer, texto: string) => createHmac("sha256", clave).update(texto).digest();

/** Codificación de RFC 3986 que exige SigV4. */
const codificar = (texto: string) =>
  encodeURIComponent(texto).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function fechaAmz(ahora: Date) {
  return ahora
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Devuelve la URL firmada; caduca a los `vigenciaSegundos` de `ahora`. */
export function firmarUrl(peticion: PeticionAFirmar, credenciales: Credenciales): string {
  const { metodo, host, ruta, region, vigenciaSegundos, ahora } = peticion;
  const amz = fechaAmz(ahora);
  const dia = amz.slice(0, 8);
  const alcance = `${dia}/${region}/s3/aws4_request`;

  const cabeceras = Object.entries({ ...peticion.cabeceras, host })
    .map(([nombre, valor]) => [nombre.toLowerCase(), valor.trim()] as const)
    .sort(([a], [b]) => (a < b ? -1 : 1));
  const firmadas = cabeceras.map(([nombre]) => nombre).join(";");

  const consulta = Object.entries({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${credenciales.idClave}/${alcance}`,
    "X-Amz-Date": amz,
    "X-Amz-Expires": String(vigenciaSegundos),
    "X-Amz-SignedHeaders": firmadas,
  })
    .map(([clave, valor]) => `${codificar(clave)}=${codificar(valor)}`)
    .sort()
    .join("&");
  const rutaCodificada = ruta.split("/").map(codificar).join("/");

  const peticionCanonica = [
    metodo,
    rutaCodificada,
    consulta,
    cabeceras.map(([nombre, valor]) => `${nombre}:${valor}\n`).join(""),
    firmadas,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const aFirmar = ["AWS4-HMAC-SHA256", amz, alcance, sha256(peticionCanonica)].join("\n");

  const claveDeFirma = ["s3", "aws4_request"].reduce(
    (clave, parte) => hmac(clave, parte),
    hmac(hmac(`AWS4${credenciales.secreto}`, dia), region),
  );
  const firma = createHmac("sha256", claveDeFirma).update(aFirmar).digest("hex");
  return `https://${host}${rutaCodificada}?${consulta}&X-Amz-Signature=${firma}`;
}
