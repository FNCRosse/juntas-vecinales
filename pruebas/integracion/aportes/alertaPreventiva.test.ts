import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { alertarMorosidad } from "@/modulos/aportes/aplicacion/morosidad";

// Emitir las cuotas de todas las casas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada.
jest.setTimeout(30_000);

// La semana del 7 al 13 de setiembre vence el domingo 13 a las 11:59 p. m. (Lima): a los 7 días de retraso, desde el
// lunes 21 de setiembre a las 5:00 a. m. (hora de Lima).
const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const ANTES = new Date("2026-09-20T15:00:00Z");
const A_LA_SEMANA = LUNES_21;
const DOS_SEMANAS = new Date("2026-09-28T15:00:00Z");
const OCHO_SEMANAS = new Date("2026-11-10T15:00:00Z");

const PROHIBIDAS = /moros|recargo|sanci|multa|suspend|reja|castig|deudor/i;

const idDe = async (dni: string) => (await prisma.usuario.findUniqueOrThrow({ where: { dni } })).id;
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;
const recordatorios = (destinatarioId?: string) =>
  prisma.avisoEnCola.findMany({
    where: { titulo: "Un recordatorio amable sobre su cuota", ...(destinatarioId ? { destinatarioId } : {}) },
  });
const casasConDeuda = async () =>
  (await prisma.cuota.groupBy({ by: ["predioId"], where: { estado: { not: "PAGADA" } } })).length;

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_alertas_preventivas, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-05 CA1 A la semana de retraso", () => {
  it("@HU-COB-05 CA1 con menos de 7 días de retraso todavía no se avisa a nadie", async () => {
    expect(await alertarMorosidad(ANTES)).toEqual({ casas: 0, alertas: 0 });
    expect(await recordatorios()).toEqual([]);
  });

  it("@HU-COB-05 CA1 a los 7 días se avisa a cada casa que se atrasó, una vez", async () => {
    const esperadas = await casasConDeuda();
    expect(esperadas).toBeGreaterThan(0);
    expect(await alertarMorosidad(A_LA_SEMANA)).toEqual({ casas: esperadas, alertas: esperadas });
    expect(await prisma.alertaPreventiva.count()).toBe(esperadas);
  });
});

describe("@HU-COB-05 CA2 El recordatorio", () => {
  it("@HU-COB-05 CA2 es cordial, dice cuánto debe y cómo pagar, y no habla de sanciones", async () => {
    await alertarMorosidad(A_LA_SEMANA);
    const [aviso, ...otros] = await recordatorios(await idDe("08123478"));
    expect(otros).toEqual([]);
    expect(aviso.tipo).toBe("PAGOS");
    expect(aviso.texto).toBe(
      "Su cuota de la semana del 7 al 13 de setiembre todavía está pendiente. Hoy debe S/ 15.00. Puede pagarla cuando le sea posible, sin ningún costo adicional: con Yape o Plin (987 654 321, a nombre de Junta Vecinal), por transferencia a la cuenta 191-2345678-0-12 o pidiendo que vayan a cobrarle en efectivo a su casa. Véala en Mi cuota.",
    );
    for (const { titulo, texto } of await recordatorios()) {
      expect(titulo + texto).not.toMatch(PROHIBIDAS);
    }
  });

  it("@HU-COB-05 CA2 sin datos de pago configurados, igual dice cómo pagar en efectivo", async () => {
    delete process.env.DATOS_PAGO_YAPE;
    delete process.env.DATOS_PAGO_CUENTA;
    await alertarMorosidad(A_LA_SEMANA);
    const [aviso] = await recordatorios(await idDe("08123478"));
    expect(aviso.texto).toContain(
      "sin ningún costo adicional: pidiendo que vayan a cobrarle en efectivo a su casa.",
    );
    process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
    process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
  });
});

describe("@HU-COB-05 CA3 Bitácora, sin sanciones", () => {
  it("@HU-COB-05 CA3 el envío queda en la bitácora financiera con los días de retraso y lo que debía", async () => {
    await alertarMorosidad(A_LA_SEMANA);
    const cuota = await prisma.cuota.findFirstOrThrow({
      where: { predioId: await predioDe("08123478") },
      orderBy: { periodo: "asc" },
    });
    expect(await prisma.alertaPreventiva.findUniqueOrThrow({ where: { cuotaId: cuota.id } })).toMatchObject({
      predioId: cuota.predioId,
      diasDeRetraso: 7,
      debe: 1500,
      residentesAvisados: 1,
    });
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      // La auditoría no se vacía entre pruebas (solo inserción) y otras corridas del worker también escriben: esta es la de esa semana.
      where: { accion: "alertar_morosidad", entidadId: "2026-09-21" },
      orderBy: { fecha: "desc" },
    });
    expect(auditoria).toMatchObject({ actorId: null, despues: { recordatorios: await casasConDeuda() } });
  });

  it("@HU-COB-05 CA3 no suspende la garita ni cobra nada de más: las deudas quedan como estaban", async () => {
    const antes = await prisma.cuota.findMany({ orderBy: [{ predioId: "asc" }, { periodo: "asc" }] });
    const casa = await predioDe("08123478");
    await alertarMorosidad(A_LA_SEMANA);
    expect(await prisma.cuota.findMany({ orderBy: [{ predioId: "asc" }, { periodo: "asc" }] })).toEqual(
      antes,
    );
    expect((await prisma.predio.findUniqueOrThrow({ where: { id: casa } })).estadoGarita).toBe("VERDE");
    expect(await prisma.pago.count()).toBe(0);
  });

  it("@HU-COB-05 la bitácora es de solo inserción", async () => {
    await alertarMorosidad(A_LA_SEMANA);
    const fila = await prisma.alertaPreventiva.findFirstOrThrow();
    await expect(
      prisma.alertaPreventiva.update({ where: { id: fila.id }, data: { debe: 1 } }),
    ).rejects.toThrow();
    await expect(prisma.alertaPreventiva.delete({ where: { id: fila.id } })).rejects.toThrow();
  });
});

describe("@HU-COB-05 Una sola alerta por cuota", () => {
  it("@HU-COB-05 AC-5 correr la tarea otra vez no avisa de nuevo", async () => {
    await alertarMorosidad(A_LA_SEMANA);
    const avisos = (await recordatorios()).length;
    expect(await alertarMorosidad(A_LA_SEMANA)).toEqual({ casas: 0, alertas: 0 });
    expect(await alertarMorosidad(new Date("2026-09-23T15:00:00Z"))).toEqual({ casas: 0, alertas: 0 });
    expect((await recordatorios()).length).toBe(avisos);
  });

  it("@HU-COB-05 AC-5 dos corridas a la vez dejan un solo aviso por casa", async () => {
    const esperadas = await casasConDeuda();
    const [a, b] = await Promise.all([alertarMorosidad(A_LA_SEMANA), alertarMorosidad(A_LA_SEMANA)]);
    expect(a.alertas + b.alertas).toBe(esperadas);
    expect(await prisma.alertaPreventiva.count()).toBe(esperadas);
    const porDestinatario = new Map<string, number>();
    for (const { destinatarioId } of await recordatorios()) {
      porDestinatario.set(destinatarioId, (porDestinatario.get(destinatarioId) ?? 0) + 1);
    }
    expect([...porDestinatario.values()].every((n) => n === 1)).toBe(true);
  });

  it("@HU-COB-05 si paga la cuota por la que se avisó y se atrasa la siguiente, esa tiene su propio aviso", async () => {
    await alertarMorosidad(A_LA_SEMANA);
    const casa = await predioDe("08123478");
    const [primera] = await prisma.cuota.findMany({ where: { predioId: casa }, orderBy: { periodo: "asc" } });
    await prisma.cuota.update({ where: { id: primera.id }, data: { estado: "PAGADA", saldoPendiente: 0 } });

    expect((await alertarMorosidad(A_LA_SEMANA)).alertas).toBe(0);
    expect((await alertarMorosidad(DOS_SEMANAS)).alertas).toBeGreaterThan(0);
    const avisos = await recordatorios(await idDe("08123478"));
    expect(avisos).toHaveLength(2);
    expect(avisos.at(-1)?.texto).toContain("Su cuota de la semana del 14 al 20 de setiembre");
    expect(avisos.at(-1)?.texto).toContain("Hoy debe S/ 10.00.");
  });

  it("@HU-COB-05 desde las 8 semanas ya no es un recordatorio: lo atiende la suspensión (HU-COB-06)", async () => {
    expect(await alertarMorosidad(OCHO_SEMANAS)).toEqual({ casas: 0, alertas: 0 });
    expect(await recordatorios()).toEqual([]);
  });

  it("@HU-COB-05 una casa al día no recibe nada", async () => {
    const casa = await predioDe("08123478");
    await prisma.cuota.updateMany({
      where: { predioId: casa },
      data: { estado: "PAGADA", saldoPendiente: 0 },
    });
    await alertarMorosidad(A_LA_SEMANA);
    expect(await recordatorios(await idDe("08123478"))).toEqual([]);
  });
});
