import { spawn, type ChildProcess } from "node:child_process";
import request from "supertest";
import { GET } from "@/app/api/salud/route";
import { prisma } from "@/compartido/bd/cliente";

// Levanta el servidor de Next dentro de la prueba (modo desarrollo, sin build) en un puerto libre.
const PUERTO = 3100 + Number(process.env.JEST_WORKER_ID ?? 0);
const URL = `http://localhost:${PUERTO}`;
let servidor: ChildProcess;

async function esperarServidor(limite: number) {
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

beforeAll(async () => {
  servidor = spawn("npx", ["next", "dev", "--port", String(PUERTO)], {
    env: { ...process.env, NODE_ENV: "development" },
    stdio: "ignore",
    detached: true,
  });
  await esperarServidor(60_000);
}, 90_000);

afterAll(async () => {
  if (servidor.pid) process.kill(-servidor.pid);
  await prisma.$disconnect();
});

describe("@HU-INFRA GET /api/salud", () => {
  it("@HU-INFRA responde 200 cuando la BD acepta consultas", async () => {
    await request(URL).get("/api/salud").expect(200, { estado: "ok" });
  }, 60_000);
});

// El código que corre dentro de Next no entra en la cobertura de Jest: el handler se llama también aquí.
describe("@HU-INFRA Handler de salud", () => {
  it("@HU-INFRA responde ok con la BD de pruebas", async () => {
    const respuesta = await GET();
    expect(respuesta.status).toBe(200);
  });

  it("@HU-INFRA responde 503 si la BD no acepta consultas", async () => {
    const espia = jest.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("sin conexión"));
    const respuesta = await GET();
    expect(respuesta.status).toBe(503);
    expect(await respuesta.json()).toEqual({ estado: "sin_bd" });
    espia.mockRestore();
  });
});
