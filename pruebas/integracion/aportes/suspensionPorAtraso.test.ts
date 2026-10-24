import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { liquidarDeuda } from "@/modulos/aportes/aplicacion/liquidaciones";
import { miReja, suspenderCasasConAtrasoCritico } from "@/modulos/aportes/aplicacion/morosidad";
import { consultar } from "@/modulos/identidad/aplicacion/garita";
import { misVisitas } from "@/modulos/identidad/aplicacion/visitas";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir nueve semanas para todas las casas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada.
jest.setTimeout(30_000);

// La semana del 27 de julio al 2 de agosto vence el domingo 2 a las 11:59 p. m. (Lima): a las 8 semanas de retraso, desde el
// lunes 28 de setiembre a las 5:00 a. m. (hora de Lima).
const LUNES = [
  "2026-07-27",
  "2026-08-03",
  "2026-08-10",
  "2026-08-17",
  "2026-08-24",
  "2026-08-31",
  "2026-09-07",
  "2026-09-14",
  "2026-09-21",
].map((d) => new Date(`${d}T15:00:00Z`));
const ANTES = new Date("2026-09-27T15:00:00Z");
const A_LAS_OCHO_SEMANAS = new Date("2026-09-28T15:00:00Z");
const LIQUIDA = new Date("2026-09-29T15:00:00Z");

let carmen: SesionDto;
let marta: SesionDto;
let luis: SesionDto;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;
const rejaDe = async (predioId: string) =>
  (await prisma.predio.findUniqueOrThrow({ where: { id: predioId } })).estadoGarita;
const avisosDeSuspension = (destinatarioId?: string) =>
  prisma.avisoEnCola.findMany({
    where: { titulo: "Por ahora la reja no se abre sola", ...(destinatarioId ? { destinatarioId } : {}) },
  });
const casasConDeuda = async () =>
  (await prisma.cuota.groupBy({ by: ["predioId"], where: { estado: { not: "PAGADA" } } })).length;

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_alertas_preventivas, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  // Las semillas dejan a una casa ya suspendida para la garita: aquí todas parten con la reja abierta.
  await prisma.predio.updateMany({ data: { estadoGarita: "VERDE" } });
  [carmen, marta, luis] = await Promise.all(["08123478", "40000002", "40000004"].map(sesionDe));
  for (const lunes of LUNES) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-06 CA1 A las 8 semanas, atraso crítico", () => {
  it("@HU-COB-06 CA1 con menos de 8 semanas de atraso no se suspende a nadie", async () => {
    expect(await suspenderCasasConAtrasoCritico(ANTES)).toEqual({ casas: 0, suspendidas: 0 });
    expect(await rejaDe(await predioDe("08123478"))).toBe("VERDE");
    expect(await avisosDeSuspension()).toEqual([]);
  });

  it("@HU-COB-06 CA1 CA2 a las 8 semanas la casa pasa a atraso crítico y la reja deja de abrirse sola", async () => {
    const esperadas = await casasConDeuda();
    expect(esperadas).toBeGreaterThan(0);
    expect(await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS)).toEqual({
      casas: esperadas,
      suspendidas: esperadas,
    });
    expect(await prisma.predio.count({ where: { estadoGarita: "ROJO" } })).toBe(esperadas);
  });

  it("@HU-COB-06 CA1 cuenta 8 semanas continuas: la cuota más antigua que todavía se debe", async () => {
    const casa = await predioDe("08123478");
    const [primera] = await prisma.cuota.findMany({ where: { predioId: casa }, orderBy: { periodo: "asc" } });
    await prisma.cuota.update({ where: { id: primera.id }, data: { estado: "PAGADA", saldoPendiente: 0 } });
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    expect(await rejaDe(casa)).toBe("VERDE");
    expect(await rejaDe(await predioDe("40000006"))).toBe("ROJO");
  });

  it("@HU-COB-06 CA2 la garita lo ve: la consulta de la casa dice que no se abre sola", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    const { resultados } = await consultar(luis, "Carmen Huamán");
    expect(resultados[0]).toMatchObject({ vivienda: "Mz. C, lote 7", estado: "ROJO" });
  });

  it("@HU-COB-06 CA2 la casa suspendida no puede registrar visitas nuevas", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    expect((await misVisitas(carmen)).puedeRegistrar).toBe(false);
  });
});

describe("@HU-COB-06 CA3 Aviso formal", () => {
  it("@HU-COB-06 CA3 los residentes reciben un aviso de seguridad que dice qué pasa y cómo volver a la normalidad", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    const [aviso, ...otros] = await avisosDeSuspension(carmen.usuarioId);
    expect(otros).toEqual([]);
    // Seguridad: no se puede desactivar.
    expect(aviso.tipo).toBe("SEGURIDAD");
    expect(aviso.texto).toBe(
      "Su casa lleva 9 semanas pendientes de pago (hoy debe S/ 45.00). Por eso el vigilante ya no abre la reja automáticamente: usted puede entrar abriéndola a mano, como siempre, y por ahora no puede registrar visitas nuevas. Para volver a la normalidad, pague lo pendiente por la app o en efectivo; apenas la directiva lo valide, la reja vuelve a abrirse sola. Si no puede pagarlo todo junto, converse con la directiva.",
    );
    expect(aviso.texto).not.toMatch(/moros|deudor|castig|multa|sanci/i);
  });

  it("@HU-COB-06 AC-6 cada suspensión queda en la auditoría con el detalle", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    const casa = await predioDe("08123478");
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "clasificar_morosidad", entidadId: casa },
    });
    expect(auditoria).toMatchObject({
      actorId: null,
      entidad: "Predio",
      despues: { estado: "Atraso crítico", semanas: 9, garita: "La reja no se abre sola" },
    });
  });

  it("@HU-COB-06 no cobra nada de más: las deudas quedan como estaban", async () => {
    const antes = await prisma.cuota.findMany({ orderBy: [{ predioId: "asc" }, { periodo: "asc" }] });
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    expect(await prisma.cuota.findMany({ orderBy: [{ predioId: "asc" }, { periodo: "asc" }] })).toEqual(
      antes,
    );
    expect(await prisma.pago.count()).toBe(0);
  });
});

describe("@HU-COB-06 Una sola vez", () => {
  it("@HU-COB-06 AC-5 correr la tarea otra vez no vuelve a avisar", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    const avisos = (await avisosDeSuspension()).length;
    const otra = await suspenderCasasConAtrasoCritico(new Date("2026-10-05T15:00:00Z"));
    expect(otra.suspendidas).toBe(0);
    expect((await avisosDeSuspension()).length).toBe(avisos);
  });

  it("@HU-COB-06 AC-5 dos corridas a la vez avisan una sola vez por casa", async () => {
    const esperadas = await casasConDeuda();
    const [a, b] = await Promise.all([
      suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS),
      suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS),
    ]);
    expect(a.suspendidas + b.suspendidas).toBe(esperadas);
    const porDestinatario = new Map<string, number>();
    for (const { destinatarioId } of await avisosDeSuspension()) {
      porDestinatario.set(destinatarioId, (porDestinatario.get(destinatarioId) ?? 0) + 1);
    }
    expect([...porDestinatario.values()].every((n) => n === 1)).toBe(true);
  });

  it("@HU-COB-06 una casa que ya estaba suspendida no recibe otro aviso", async () => {
    const casa = await predioDe("08123478");
    await prisma.predio.update({ where: { id: casa }, data: { estadoGarita: "ROJO" } });
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    expect(await avisosDeSuspension(carmen.usuarioId)).toEqual([]);
  });

  it("@HU-COB-06 ponerse al día restituye la reja, y una nueva deuda de 8 semanas la suspende otra vez", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    const casa = await predioDe("08123478");
    expect(await rejaDe(casa)).toBe("ROJO");
    await liquidarDeuda(marta, { predioId: casa, medio: "EFECTIVO", idOperacion: randomUUID() }, LIQUIDA);
    expect(await rejaDe(casa)).toBe("VERDE");
    expect(await suspenderCasasConAtrasoCritico(LIQUIDA)).toMatchObject({ suspendidas: expect.any(Number) });
    expect(await rejaDe(casa)).toBe("VERDE");
  });
});

describe("@HU-COB-06 VEC-COB-12 Lo que ve la casa", () => {
  it("@HU-COB-06 la casa suspendida ve cuánto debe y desde cuándo; otra casa al día no ve nada raro", async () => {
    await suspenderCasasConAtrasoCritico(A_LAS_OCHO_SEMANAS);
    expect(await miReja(carmen)).toEqual({
      suspendida: true,
      semanas: 9,
      debe: 4500,
      detalle: "9 semanas, del 27 de julio al 27 de setiembre",
      umbral: 8,
    });
    await prisma.cuota.updateMany({
      where: { predioId: await predioDe("08123478") },
      data: { estado: "PAGADA", saldoPendiente: 0 },
    });
    await prisma.predio.update({
      where: { id: await predioDe("08123478") },
      data: { estadoGarita: "VERDE" },
    });
    expect(await miReja(carmen)).toMatchObject({ suspendida: false, semanas: 0, debe: 0 });
  });
});
