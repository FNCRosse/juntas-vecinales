import { randomBytes } from "node:crypto";

// Las pruebas nunca usan la CLAVE_CIFRADO real: cada corrida inventa una al azar que no se guarda.
process.env.CLAVE_CIFRADO ??= randomBytes(32).toString("base64");
