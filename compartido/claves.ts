import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Claves y tokens (docs/BACKEND.md §5): scrypt con sal por usuario y tokens aleatorios de 32 bytes
// de los que solo se guarda el hash SHA-256.

const LARGO_HASH = 64;

function derivar(clave: string, sal: string) {
  return new Promise<Buffer>((resolver, rechazar) =>
    scrypt(clave.normalize("NFKC"), sal, LARGO_HASH, (error, derivada) =>
      error ? rechazar(error) : resolver(derivada),
    ),
  );
}

export async function cifrarClave(clave: string) {
  const sal = randomBytes(16).toString("base64url");
  return { sal, hash: (await derivar(clave, sal)).toString("base64url") };
}

export async function claveCoincide(clave: string, guardada: { sal: string; hash: string }) {
  const esperada = Buffer.from(guardada.hash, "base64url");
  const derivada = await derivar(clave, guardada.sal);
  return esperada.length === derivada.length && timingSafeEqual(esperada, derivada);
}

/** Token para una cookie o un enlace: el valor viaja a la persona; en la BD va solo `hash`. */
export function nuevoToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDeToken(token) };
}

export const hashDeToken = (token: string) => createHash("sha256").update(token).digest("hex");
