import { randomUUID } from "node:crypto";
import { POST as liquidarHttp } from "@/app/api/aportes/liquidaciones/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import {
  buscarCasasPorPonerAlDia,
  liquidarDeuda,
  verCasaPorPonerAlDia,
} from "@/modulos/aportes/aplicacion/liquidaciones";
import { misPagos } from "@/modulos/aportes/aplicacion/pagos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir nueve semanas para todas las casas en cada prueba tarda más que los 5 s de siempre, sobre todo con la cobertura.
jest.setTimeout(30_000);

// Julio (Mz. A, lote 3) lleva nueve semanas sin pagar: del lunes 27 de julio al 21 de setiembre. La emisión de cada
// semana corre su lunes, como lo haría el worker.
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
const LIQUIDA = new Date("2026-09-27T15:52:00Z");

let julio: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let predioJulio: string;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

const suspenderReja = (predioId = predioJulio) =>
  prisma.predio.update({ where: { id: predioId }, data: { estadoGarita: "ROJO" } });
const rejaDe = async (predioId = predioJulio) =>
  (await prisma.predio.findUniqueOrThrow({ where: { id: predioId } })).estadoGarita;
const deudaDe = async (predioId = predioJulio) =>
  (
    await prisma.cuota.aggregate({
      where: { predioId, estado: { not: "PAGADA" } },
      _sum: { saldoPendiente: true },
    })
  )._sum.saldoPendiente ?? 0;

const liquidar = (
  extra: Partial<{ predioId: string; medio: string; numeroOperacion: string; idOperacion: string }> = {},
  sesion = marta,
) =>
  liquidarDeuda(
    sesion,
    { predioId: predioJulio, medio: "EFECTIVO", idOperacion: randomUUID(), ...extra },
    LIQUIDA,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [julio, marta, pedro] = await Promise.all(["40000006", "40000002", "40000003"].map(sesionDe));
  predioJulio = await predioDe("40000006");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of LUNES) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-07 CA1 Buscar a quien se va a poner al día", () => {
  it("@HU-COB-07 CA1 se busca por nombre o DNI y la ficha dice lo que debe, desde cuándo y si la reja se abre sola", async () => {
    await suspenderReja();
    const { casas } = await buscarCasasPorPonerAlDia(marta, "Julio Mendoza");
    expect(casas).toHaveLength(1);
    expect(casas[0]).toMatchObject({
      predioId: predioJulio,
      nombre: "Julio Mendoza",
      vivienda: "Mz. A, lote 3",
      dniTerminadoEn: "06",
      semanas: 9,
      detalle: "9 semanas, del 27 de julio al 27 de setiembre",
      rejaSuspendida: true,
      esSuya: false,
      puedeRegistrar: true,
    });
    expect(casas[0].debe).toBe(await deudaDe());
    expect(casas[0].debe).toBeGreaterThan(0);
    expect(casas[0].cuotaSemanal).toMatch(/^S\/ \d+\.\d{2} \(casa S\/ 2\.50 \+ /);
    expect((await buscarCasasPorPonerAlDia(marta, "40000006")).casas[0].predioId).toBe(predioJulio);
    expect((await buscarCasasPorPonerAlDia(marta, "J")).casas).toEqual([]);
  });

  it("@HU-COB-07 CA1 el mediador ve la ficha sin poder registrar; la casa propia no se registra; el vecino no entra", async () => {
    expect((await buscarCasasPorPonerAlDia(pedro, "Julio")).casas[0].puedeRegistrar).toBe(false);
    expect((await buscarCasasPorPonerAlDia(marta, "Marta Rojas")).casas[0]).toMatchObject({
      esSuya: true,
      puedeRegistrar: false,
    });
    await expect(buscarCasasPorPonerAlDia(julio, "Julio")).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect((await verCasaPorPonerAlDia(marta, predioJulio)).vivienda).toBe("Mz. A, lote 3");
    await expect(verCasaPorPonerAlDia(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-07 una casa que no debe nada se ve «al día» y no ofrece registrar nada", async () => {
    const { casas } = await buscarCasasPorPonerAlDia(marta, "Carmen Huamán");
    // Carmen también tiene cuotas por emitir desde el 27 de julio: se pagan todas para probar la casa al día.
    await liquidar({ predioId: casas[0].predioId });
    expect(await verCasaPorPonerAlDia(marta, casas[0].predioId)).toMatchObject({
      debe: 0,
      semanas: 0,
      puedeRegistrar: false,
    });
  });
});

describe("@HU-COB-07 CA1 CA2 CA3 Poner al día", () => {
  it("@HU-COB-07 CA1 CA2 el pago total deja todas las cuotas pagadas, la casa al día y la garita en verde", async () => {
    await suspenderReja();
    const antes = await deudaDe();
    const r = await liquidar();
    expect(r).toMatchObject({
      aplicado: true,
      nombre: "Julio Mendoza",
      vivienda: "Mz. A, lote 3",
      monto: antes,
      semanas: "9 semanas, del 27 de julio al 27 de setiembre",
      reabreLaReja: true,
      recibo: {
        numero: "000001",
        titular: "Julio Mendoza",
        medio: "Efectivo",
        monto: antes,
        concepto: "Cuota de vigilancia: 9 semanas, del 27 de julio al 27 de setiembre (deuda acumulada)",
        registradoPor: "Marta Rojas",
      },
    });
    expect(await deudaDe()).toBe(0);
    expect(await prisma.cuota.count({ where: { predioId: predioJulio, estado: "PAGADA" } })).toBe(9);
    expect(await rejaDe()).toBe("VERDE");
    const pago = await prisma.pago.findFirstOrThrow({ include: { cuotas: true } });
    expect(pago).toMatchObject({ medio: "EFECTIVO", estado: "APROBADO", monto: antes });
    expect(pago.cuotas).toHaveLength(9);
    expect(await verCasaPorPonerAlDia(marta, predioJulio)).toMatchObject({ debe: 0, rejaSuspendida: false });
  });

  it("@HU-COB-07 CA3 la casa recibe el aviso con su recibo y la garita sabe que la reja vuelve a abrirse sola", async () => {
    await suspenderReja();
    const r = await liquidar();
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: julio.usuarioId, titulo: "Su pago fue aprobado" },
    });
    expect(aviso.texto).toBe(
      `Recibimos su pago de S/ ${(r.monto / 100).toFixed(2)}. Ya está al día. Gracias. Su recibo N.° 000001 ya está en Mis pagos y recibos. La reja vuelve a abrirse sola.`,
    );
    const garita = await prisma.avisoEnCola.findMany({ where: { titulo: "Una casa se puso al día" } });
    expect(garita).toHaveLength(1);
    expect(garita[0]).toMatchObject({
      tipo: "GARITA",
      texto: "Mz. A, lote 3 pagó toda su deuda: la reja vuelve a abrirse sola.",
    });
    expect(r.garita).toEqual(["Luis Paredes"]);
    expect(r.cuando).toBe("27 de setiembre de 2026 a las 10:52 a. m.");
    expect((await misPagos(julio)).pagos[0]).toMatchObject({
      estado: "Aprobado",
      recibo: { numero: "000001" },
    });
  });

  it("@HU-COB-07 CA1 por Yape, Plin o transferencia se puede anotar el número de operación", async () => {
    const r = await liquidar({ medio: "YAPE_O_PLIN", numeroOperacion: " 004512 " });
    expect(r.recibo!.medio).toBe("Yape o Plin (operación 004512)");
    expect((await prisma.pago.findFirstOrThrow()).medio).toBe("YAPE_O_PLIN");
    const transferencia = await liquidar({ predioId: await predioDe("08123478"), medio: "TRANSFERENCIA" });
    expect(transferencia.recibo!.medio).toBe("Transferencia bancaria");
  });

  it("@HU-COB-07 si la reja no estaba suspendida, no se avisa a la garita ni se habla de la reja", async () => {
    await prisma.predio.update({ where: { id: predioJulio }, data: { estadoGarita: "VERDE" } });
    const r = await liquidar();
    expect(r).toMatchObject({ reabreLaReja: false, garita: [] });
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Una casa se puso al día" } })).toBe(0);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: julio.usuarioId, titulo: "Su pago fue aprobado" },
    });
    expect(aviso.texto).not.toContain("reja");
  });

  it("@HU-COB-07 AC-6 poner al día queda en la auditoría con quién lo registró", async () => {
    const r = await liquidar();
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "liquidar_deuda", entidadId: (await prisma.pago.findFirstOrThrow()).id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      despues: { recibo: "000001", debeAhora: "S/ 0.00" },
    });
    expect(r.recibo!.registradoPor).toBe("Marta Rojas");
  });
});

describe("@HU-COB-07 Reglas", () => {
  it("@HU-COB-07 AC-5 mandar el mismo pago dos veces no abona, ni emite recibo, ni avisa dos veces", async () => {
    await suspenderReja();
    const idOperacion = randomUUID();
    const primero = await liquidar({ idOperacion });
    const repetido = await liquidar({ idOperacion });
    expect(repetido).toMatchObject({
      aplicado: false,
      monto: primero.monto,
      nombre: "Julio Mendoza",
      semanas: "9 semanas, del 27 de julio al 27 de setiembre",
      recibo: { id: primero.recibo!.id },
    });
    expect(await prisma.pago.count()).toBe(1);
    expect(await prisma.recibo.count()).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su pago fue aprobado" } })).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Una casa se puso al día" } })).toBe(1);
    await expect(liquidar({ idOperacion }, pedro)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-07 AC-5 dos envíos a la vez del mismo pago dejan uno solo", async () => {
    const idOperacion = randomUUID();
    const resultados = await Promise.all([liquidar({ idOperacion }), liquidar({ idOperacion })]);
    expect(resultados.map((r) => r.aplicado).sort()).toEqual([false, true]);
    expect(await prisma.pago.count()).toBe(1);
    expect(await deudaDe()).toBe(0);
  });

  it("@HU-COB-07 solo la directiva registra: ni el mediador ni el vecino", async () => {
    await expect(liquidar({}, pedro)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(liquidar({}, julio)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect(await prisma.pago.count()).toBe(0);
    expect(await deudaDe()).toBeGreaterThan(0);
  });

  it("@HU-COB-07 hay que elegir cómo pagó, la casa tiene que existir y deber algo", async () => {
    await expect(liquidar({ medio: "" })).rejects.toMatchObject({ campos: { medio: "Elija cómo pagó." } });
    await expect(liquidar({ numeroOperacion: "9".repeat(31) })).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(liquidar({ predioId: randomUUID() })).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await liquidar();
    await expect(liquidar()).rejects.toThrow(/ya está al día/);
  });

  it("@HU-COB-07 la deuda de la casa de quien registra la pone al día otro miembro de la directiva", async () => {
    await expect(liquidar({ predioId: await predioDe("40000002") })).rejects.toThrow(
      /la registra otro miembro/,
    );
  });

  it("@HU-COB-07 con un pago en revisión primero se resuelve ese pago", async () => {
    const cuota = await prisma.cuota.findFirstOrThrow({ where: { predioId: predioJulio } });
    await prisma.pago.create({
      data: {
        idOperacion: randomUUID(),
        predioId: predioJulio,
        autorId: julio.usuarioId,
        medio: "YAPE_O_PLIN",
        monto: 250,
        cuotas: { create: { cuotaId: cuota.id, monto: 250 } },
      },
    });
    await expect(liquidar()).rejects.toThrow(/pago en revisión/);
    expect(await deudaDe()).toBeGreaterThan(0);
  });
});

describe("@HU-COB-07 Endpoint", () => {
  const llamar = (token: string | null, cuerpo: unknown) =>
    liquidarHttp(
      new Request("http://localhost/api/aportes/liquidaciones", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: JSON.stringify(cuerpo),
      }),
      undefined,
    );

  it("@HU-COB-07 POST /api/aportes/liquidaciones registra (201), repetirlo responde 200; sin permiso 403, sin sesión 401", async () => {
    const cuerpo = { predioId: predioJulio, medio: "EFECTIVO", idOperacion: randomUUID() };
    const primera = await llamar(tokenMarta, cuerpo);
    expect(primera.status).toBe(201);
    expect(await primera.json()).toMatchObject({ aplicado: true, nombre: "Julio Mendoza" });
    const repetida = await llamar(tokenMarta, cuerpo);
    expect(repetida.status).toBe(200);
    expect((await repetida.json()).aplicado).toBe(false);
    expect((await llamar(tokenAna, cuerpo)).status).toBe(403);
    expect((await llamar(null, cuerpo)).status).toBe(401);
    const sinMedio = await llamar(tokenMarta, { ...cuerpo, medio: "", idOperacion: randomUUID() });
    expect(sinMedio.status).toBe(400);
  });
});
