import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "cypress";
import { Client } from "pg";

const CARPETA_AXE = "pruebas/e2e/reportes/axe";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "pruebas/e2e/**/*.cy.ts",
    supportFile: "pruebas/e2e/soporte/e2e.ts",
    fixturesFolder: false,
    screenshotsFolder: "pruebas/e2e/screenshots",
    videosFolder: "pruebas/e2e/videos",
    video: false,
    allowCypressEnv: false,
    setupNodeEvents(on) {
      on("task", {
        // Guarda el resultado de axe por pantalla: es la evidencia de cierre de cada módulo.
        guardarAxe({ nombre, resultado }: { nombre: string; resultado: unknown }) {
          mkdirSync(CARPETA_AXE, { recursive: true });
          writeFileSync(path.join(CARPETA_AXE, `${nombre}.json`), JSON.stringify(resultado, null, 2));
          return null;
        },
        // El enlace de entrada que se encoló hacia ese WhatsApp: en las pruebas no sale a Meta y el
        // worker no corre, así que sigue en la cola. Solo la BD de pruebas (DATABASE_URL del CI).
        async enlaceEnCola({
          telefono,
          plantilla = "enlace_acceso",
        }: {
          telefono: string;
          plantilla?: string;
        }) {
          const cliente = new Client({ connectionString: process.env.DATABASE_URL });
          await cliente.connect();
          try {
            const { rows } = await cliente.query<{ parametros: string[] }>(
              `SELECT parametros FROM nucleo_cola_avisos WHERE telefono = $1 AND plantilla = $2
               ORDER BY "creadoEn" DESC LIMIT 1`,
              [telefono, plantilla],
            );
            return rows[0]?.parametros[1] ?? null;
          } finally {
            await cliente.end();
          }
        },
      });
    },
  },
});
