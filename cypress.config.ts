import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "cypress";

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
      });
    },
  },
});
