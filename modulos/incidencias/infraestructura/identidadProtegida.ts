// @HU-QUE-02
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

// IdentidadProtegida (R-09): quién envió una queja anónima, cifrado con AES-256-GCM y la clave
// CLAVE_CIFRADO (32 bytes en base64). El hash (HMAC-SHA256 con la misma clave) deja que el propio vecino
// liste sus reportes sin descifrar nada. Ninguna pantalla ni endpoint devuelve el id descifrado: solo lo
// usa el sistema para avisarle.

type Entorno = Record<string, string | undefined>;

function clave(entorno: Entorno) {
  const valor = entorno.CLAVE_CIFRADO;
  const bytes = valor ? Buffer.from(valor, "base64") : Buffer.alloc(0);
  if (bytes.length !== 32) {
    throw new Error("Falta CLAVE_CIFRADO (32 bytes en base64) para proteger los reportes anónimos");
  }
  return bytes;
}

/** El hash del denunciante: el mismo vecino da siempre el mismo valor, sin revelar quién es. */
export const hashDenunciante = (usuarioId: string, entorno: Entorno = process.env) =>
  createHmac("sha256", clave(entorno)).update(`denunciante:${usuarioId}`).digest("hex");

/** `iv.etiqueta.cifrado`, en base64. */
export function cifrar(usuarioId: string, entorno: Entorno = process.env) {
  const iv = randomBytes(12);
  const cifrador = createCipheriv("aes-256-gcm", clave(entorno), iv);
  const cifrado = Buffer.concat([cifrador.update(usuarioId, "utf8"), cifrador.final()]);
  return [iv, cifrador.getAuthTag(), cifrado].map((b) => b.toString("base64")).join(".");
}

export function descifrar(datos: string, entorno: Entorno = process.env) {
  const [iv, etiqueta, cifrado] = datos.split(".").map((p) => Buffer.from(p, "base64"));
  const descifrador = createDecipheriv("aes-256-gcm", clave(entorno), iv);
  descifrador.setAuthTag(etiqueta);
  return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString("utf8");
}
