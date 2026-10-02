// Levanta `next start` sobre el build, corre Cypress en headless y apaga el servidor.
// Los argumentos se pasan a Cypress: npm run test:e2e -- --spec pruebas/e2e/infra/inicio.cy.ts
import { spawn } from "node:child_process";

const URL = "http://localhost:3000";
const servidor = spawn("npx", ["next", "start", "--port", "3000"], { stdio: "inherit", detached: true });

async function esperarServidor(limite = 60_000) {
  for (const fin = Date.now() + limite; Date.now() < fin;) {
    try {
      await fetch(URL, { method: "HEAD" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Next no respondió en ${URL}`);
}

let codigo = 1;
try {
  await esperarServidor();
  const cypress = spawn("npx", ["cypress", "run", ...process.argv.slice(2)], { stdio: "inherit" });
  codigo = await new Promise((resolver) => cypress.on("exit", (c) => resolver(c ?? 1)));
} finally {
  process.kill(-servidor.pid);
}
process.exit(codigo);
