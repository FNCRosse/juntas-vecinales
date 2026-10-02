import { defineConfig } from "prisma/config";

// Prisma 7 no lee .env: en local se cargan los valores de .env.local si existe.
try {
  process.loadEnvFile(".env.local");
} catch {}

// Las migraciones usan la conexión directa; la app y el worker, la de pooling (docs/DATOS.md §1).
export default defineConfig({
  schema: "compartido/bd/esquema",
  migrations: { path: "compartido/bd/esquema/migrations" },
  datasource: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL },
});
