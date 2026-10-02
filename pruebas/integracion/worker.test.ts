import { Client } from "pg";
import request from "supertest";
import { prisma } from "@/compartido/bd/cliente";
import { CERROJO_WORKER } from "@/worker/ejecutor";
import { crearServidor } from "@/worker/servidor";

const SECRETO = "secreto-solo-para-pruebas";
const servidor = crearServidor(SECRETO);

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE nucleo_ejecuciones_worker`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-INFRA Worker", () => {
  it("@HU-INFRA GET /salud responde sin tocar la BD", async () => {
    await request(servidor).get("/salud").expect(200, { estado: "ok" });
  });

  it("@HU-INFRA POST /tareas/ejecutar sin el secreto responde 401 y no registra nada", async () => {
    await request(servidor).post("/tareas/ejecutar").expect(401);
    await request(servidor).post("/tareas/ejecutar").set("x-secreto-worker", "otro").expect(401);
    expect(await prisma.ejecucionWorker.count()).toBe(0);
  });

  it("@HU-INFRA sin SECRETO_WORKER configurado nadie puede ejecutar", async () => {
    await request(crearServidor(undefined)).post("/tareas/ejecutar").set("x-secreto-worker", "").expect(401);
  });

  it("@HU-INFRA con el secreto toma el cerrojo y registra la ejecución", async () => {
    const respuesta = await request(servidor)
      .post("/tareas/ejecutar")
      .set("x-secreto-worker", SECRETO)
      .expect(200);

    expect(respuesta.body.estado).toBe("ejecutada");
    const ejecucion = await prisma.ejecucionWorker.findUniqueOrThrow({ where: { id: respuesta.body.id } });
    expect(ejecucion.resultado).toBe("EXITOSA");
    expect(ejecucion.terminadaEn).not.toBeNull();
  });

  it("@HU-INFRA si otra ejecución tiene el cerrojo, termina sin efecto", async () => {
    const otraConexion = new Client({ connectionString: process.env.DATABASE_URL });
    await otraConexion.connect();
    try {
      await otraConexion.query("BEGIN");
      await otraConexion.query("SELECT pg_advisory_xact_lock($1)", [CERROJO_WORKER]);

      await request(servidor)
        .post("/tareas/ejecutar")
        .set("x-secreto-worker", SECRETO)
        .expect(200, { estado: "ocupado" });
      expect(await prisma.ejecucionWorker.count()).toBe(0);
    } finally {
      await otraConexion.query("ROLLBACK");
      await otraConexion.end();
    }
  });

  it("@HU-INFRA si la ejecución falla, la registra como FALLIDA y responde 500", async () => {
    const espia = jest.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("fallo simulado"));
    const silencio = jest.spyOn(console, "error").mockImplementation(() => {});

    await request(servidor).post("/tareas/ejecutar").set("x-secreto-worker", SECRETO).expect(500);

    const [ejecucion] = await prisma.ejecucionWorker.findMany();
    expect(ejecucion.resultado).toBe("FALLIDA");
    expect(ejecucion.detalle).toContain("fallo simulado");
    espia.mockRestore();
    silencio.mockRestore();
  });

  it("@HU-INFRA una ruta desconocida responde 404", async () => {
    await request(servidor).get("/otra").expect(404);
  });
});
