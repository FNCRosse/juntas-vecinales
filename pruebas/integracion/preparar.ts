import { execSync } from "node:child_process";

// Aplica las migraciones a la BD de pruebas (DATABASE_URL de .env.test.local o del CI).
export default function preparar() {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
