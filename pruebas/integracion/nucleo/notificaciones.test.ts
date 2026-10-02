import { randomUUID } from "node:crypto";
import request from "supertest";
import { prisma } from "@/compartido/bd/cliente";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { type AvisoNuevo, encolarAviso } from "@/compartido/notificaciones/encolar";
import { crearSimulador, elegirCanal } from "@/compartido/notificaciones/whatsapp";
import { crearServidor } from "@/worker/servidor";

const simulador = crearSimulador({});
const simuladorEnFallo = crearSimulador({ WHATSAPP_SIMULAR_FALLO: "1" });
const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);

const aviso = (cambios: Partial<AvisoNuevo> = {}): AvisoNuevo => ({
  destinatarioId: randomUUID(),
  titulo: "Su recibo ya está listo",
  texto: "Su recibo N.° 000318 por S/ 5.00 ya está disponible.",
  whatsapp: { telefono: "51900000001", plantilla: "recibo_listo", parametros: ["000318"] },
  ...cambios,
});

const encolar = (datos: AvisoNuevo, creadoEn = T0) =>
  prisma.$transaction(async (tx) => {
    const { id } = await encolarAviso(datos, tx);
    await tx.avisoEnCola.update({ where: { id }, data: { creadoEn, reintentarDesde: creadoEn } });
    return id;
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE nucleo_notificaciones, nucleo_cola_avisos, nucleo_ejecuciones_worker`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-INFRA ADR-006 Cola de avisos con copia interna garantizada", () => {
  it("@HU-INFRA ADR-006 el aviso se encola en la transacción del caso de uso: si se deshace, no queda", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await encolarAviso(aviso(), tx);
        throw new Error("la acción falló");
      }),
    ).rejects.toThrow("la acción falló");
    expect(await prisma.avisoEnCola.count()).toBe(0);
  });

  it("@HU-INFRA ADR-006 con el simulador escribe la copia interna y marca el aviso como enviado", async () => {
    const datos = aviso();
    const id = await encolar(datos);

    expect(await despacharAvisos(T0, simulador)).toEqual({
      enviados: 1,
      sinCanal: 0,
      reintentos: 0,
      fallidos: 0,
    });

    const enCola = await prisma.avisoEnCola.findUniqueOrThrow({
      where: { id },
      include: { notificacion: true },
    });
    expect(enCola).toMatchObject({ estado: "ENVIADA", canal: "simulador", intentos: 1, enviadoEn: T0 });
    expect(enCola.notificacion).toMatchObject({
      destinatarioId: datos.destinatarioId,
      titulo: datos.titulo,
      leidaEn: null,
    });
  });

  it("@HU-INFRA ADR-006 si WhatsApp falla, la copia interna ya existe y reintenta a los 1, 4 y 16 min antes de darlo por fallido", async () => {
    const id = await encolar(aviso());
    const estado = () => prisma.avisoEnCola.findUniqueOrThrow({ where: { id } });

    expect((await despacharAvisos(T0, simuladorEnFallo)).reintentos).toBe(1);
    expect(await prisma.notificacion.count({ where: { avisoId: id } })).toBe(1);
    expect(await estado()).toMatchObject({ estado: "PENDIENTE", intentos: 1, reintentarDesde: minutos(1) });
    expect((await estado()).ultimoError).toContain("Fallo simulado");

    // Antes de que venza la espera no se vuelve a intentar.
    expect(await despacharAvisos(minutos(0.5), simuladorEnFallo)).toEqual({
      enviados: 0,
      sinCanal: 0,
      reintentos: 0,
      fallidos: 0,
    });

    await despacharAvisos(minutos(1), simuladorEnFallo);
    expect(await estado()).toMatchObject({ intentos: 2, reintentarDesde: minutos(5) });
    await despacharAvisos(minutos(5), simuladorEnFallo);
    expect(await estado()).toMatchObject({ intentos: 3, reintentarDesde: minutos(21) });

    expect((await despacharAvisos(minutos(21), simuladorEnFallo)).fallidos).toBe(1);
    expect(await estado()).toMatchObject({ estado: "FALLIDA", intentos: 4 });
    expect(await prisma.notificacion.count({ where: { avisoId: id } })).toBe(1);

    // Un aviso fallido no se vuelve a tomar.
    expect((await despacharAvisos(minutos(60), simulador)).enviados).toBe(0);
  });

  it("@HU-INFRA ADR-006 en producción, aunque WhatsApp falle, el aviso aparece en la copia interna", async () => {
    const id = await encolar(aviso());
    // Producción sin credenciales de Meta: el canal externo falla siempre.
    const canalDeProduccion = elegirCanal({ NODE_ENV: "production" });
    expect(canalDeProduccion.nombre).toBe("meta");

    await despacharAvisos(T0, canalDeProduccion);

    expect(await prisma.notificacion.findUnique({ where: { avisoId: id } })).not.toBeNull();
    expect(await prisma.avisoEnCola.findUniqueOrThrow({ where: { id } })).toMatchObject({
      estado: "PENDIENTE",
      canal: "meta",
    });
  });

  it("@HU-INFRA ADR-006 sin teléfono, el aviso queda solo en el centro de notificaciones", async () => {
    const id = await encolar(aviso({ whatsapp: undefined }));
    expect((await despacharAvisos(T0, simulador)).sinCanal).toBe(1);
    expect(await prisma.avisoEnCola.findUniqueOrThrow({ where: { id } })).toMatchObject({
      estado: "SIN_CANAL_EXTERNO",
    });
    expect(await prisma.notificacion.count({ where: { avisoId: id } })).toBe(1);
  });

  it("@HU-INFRA ADR-006 despacha en orden de llegada y en lotes hasta vaciar la cola", async () => {
    for (let i = 0; i < 25; i++) await encolar(aviso(), new Date(T0.getTime() - (25 - i) * 1000));
    expect((await despacharAvisos(T0, simulador)).enviados).toBe(25);
    expect(await prisma.notificacion.count()).toBe(25);
  });

  it("@HU-INFRA ADR-006 el worker despacha la cola en cada ejecución y lo registra", async () => {
    const id = await encolar(aviso(), new Date());
    const respuesta = await request(crearServidor("secreto-de-prueba"))
      .post("/tareas/ejecutar")
      .set("x-secreto-worker", "secreto-de-prueba")
      .expect(200);

    expect(await prisma.notificacion.count({ where: { avisoId: id } })).toBe(1);
    const ejecucion = await prisma.ejecucionWorker.findUniqueOrThrow({ where: { id: respuesta.body.id } });
    expect(JSON.parse(ejecucion.detalle ?? "{}")).toEqual({
      avisos: { enviados: 1, sinCanal: 0, reintentos: 0, fallidos: 0 },
      // Y depura lo vencido (DATOS.md §6); lo prueba retencion.test.ts.
      depurados: expect.objectContaining({ bitacora: expect.any(Number), sesiones: expect.any(Number) }),
    });
  });
});
