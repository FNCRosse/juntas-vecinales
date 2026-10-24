import { randomUUID } from "node:crypto";
import { PATCH as cancelarHttp } from "@/app/api/aportes/cobros-en-casa/[id]/cancelar/route";
import { POST as pedirHttp } from "@/app/api/aportes/cobros-en-casa/route";
import { POST as cobrarHttp } from "@/app/api/aportes/pagos/presencial/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import {
  cancelarPedidoDeCobro,
  cobrosEnCasaPorAtender,
  pedirCobroEnCasa,
  registrarCobroEnEfectivo,
  verPedidoDeCobro,
} from "@/modulos/aportes/aplicacion/cobros";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import {
  comprobantesPorRevisar,
  datosParaPagar,
  MEDIO_EN_CASA,
  misPagos,
} from "@/modulos/aportes/aplicacion/pagos";
import { recibosEnPapelPorEntregar } from "@/modulos/aportes/aplicacion/recibos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir las cuotas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada o corre con cobertura.
jest.setTimeout(30_000);

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const PEDIDO = new Date("2026-09-22T15:18:00Z");
const SINCRONIZA = new Date("2026-09-25T14:00:00Z");
const COBRO = "2026-09-24T16:05:00Z";

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const pedir = (
  sesion: SesionDto,
  extra: Partial<{ semanas: number; franja: string; nota: string; idOperacion: string }> = {},
) => pedirCobroEnCasa(sesion, { semanas: 3, franja: "MANANA", idOperacion: randomUUID(), ...extra }, PEDIDO);

/** La casa de Carmen pide el cobro en casa y devuelve el id del pedido. */
async function pedidoDeCarmen(extra: Parameters<typeof pedir>[1] = {}) {
  const { pedido } = await pedir(carmen, extra);
  return pedido.id;
}

const cobrar = (
  pedidoId: string,
  extra: Partial<{
    idOperacionLocal: string;
    monto: number;
    reciboEnPapel: boolean;
    registradoEn: string;
  }> = {},
  sesion = marta,
) =>
  registrarCobroEnEfectivo(
    sesion,
    {
      idOperacionLocal: randomUUID(),
      pedidoId,
      monto: 1500,
      reciboEnPapel: false,
      registradoEn: COBRO,
      ...extra,
    },
    SINCRONIZA,
  );

const garitaDe = async (dni: string) => {
  const r = await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } });
  return prisma.predio.findUniqueOrThrow({ where: { id: r.predioId } });
};

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [carmen, julio, marta, pedro] = await Promise.all(
    ["08123478", "40000006", "40000002", "40000003"].map(sesionDe),
  );
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-11 La casa pide que vayan a cobrar", () => {
  it("@HU-COB-11 CA1 «Pagar mi cuota» ofrece el efectivo en casa, con sus datos y las franjas de visita", async () => {
    const datos = await datosParaPagar(carmen);
    expect(datos.medios.at(-1)).toEqual({
      valor: MEDIO_EN_CASA,
      etiqueta: "En efectivo: que la directiva venga a mi casa",
    });
    expect(datos.cobroEnCasa).toMatchObject({ quienPide: "Carmen Huamán", direccion: "Mz. C, lote 7" });
    expect(datos.cobroEnCasa.telefono).toMatch(/^terminado en \d{3}$/);
    expect(datos.cobroEnCasa.franjas.map((f) => f.valor)).toEqual(["MANANA", "TARDE", "NOCHE"]);
  });

  it("@HU-COB-11 CA1 el pedido queda pendiente de visita, avisa a la directiva y se audita", async () => {
    const { pedido, creado } = await pedir(carmen, { nota: "Tocar el timbre" });
    expect(creado).toBe(true);
    expect(pedido).toMatchObject({
      numero: "C-001",
      monto: 1500,
      semanas: "3 semanas, del 7 al 27 de setiembre",
      donde: "En su casa, Mz. C, lote 7",
      franja: "Mañana, de 8:00 a. m. a 12:00 m.",
      estado: "Pendiente de visita",
    });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: marta.usuarioId, titulo: "Pidieron que vayan a cobrar" },
    });
    expect(aviso.texto).toBe(
      "Carmen Huamán (Mz. C, lote 7) pidió que vayan a cobrar S/ 15.00 a su casa. Véalo en Cobros.",
    );
    expect(
      await prisma.registroAuditoria.count({
        where: { accion: "pedir_cobro_en_casa", entidadId: pedido.id },
      }),
    ).toBe(1);
    expect((await miCuota(carmen))!.cobroEnCasa).toEqual({
      numero: "C-001",
      franja: "Mañana, de 8:00 a. m. a 12:00 m.",
      monto: 1500,
    });
  });

  it("@HU-COB-11 AC-5 repetir el mismo pedido devuelve el anterior sin avisar otra vez; otra casa no lo ve", async () => {
    const idOperacion = randomUUID();
    const primero = await pedir(carmen, { idOperacion });
    const avisos = () => prisma.avisoEnCola.count({ where: { titulo: "Pidieron que vayan a cobrar" } });
    const antes = await avisos();
    const repetido = await pedir(carmen, { idOperacion });
    expect(repetido).toMatchObject({ creado: false, pedido: { id: primero.pedido.id } });
    expect(await avisos()).toBe(antes);
    await expect(pedir(julio, { idOperacion })).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-11 hay que elegir cuánto y a qué hora, y una casa tiene un solo pedido pendiente", async () => {
    await expect(pedir(carmen, { franja: "" })).rejects.toMatchObject({
      campos: { franja: "Elija a qué hora le queda mejor que vayan." },
    });
    await expect(pedir(carmen, { semanas: 9 })).rejects.toMatchObject({
      campos: { semanas: "Elija cuánto va a pagar." },
    });
    await expect(pedir(carmen, { nota: "a".repeat(301) })).rejects.toBeInstanceOf(ErrorValidacion);
    await pedir(carmen);
    await expect(pedir(carmen)).rejects.toThrow(/Ya pidió que vayan a cobrar/);
  });

  it("@HU-COB-11 «Prefiero pagar por Yape o transferencia» cancela el pedido, una sola vez, y se puede pedir de nuevo", async () => {
    const id = await pedidoDeCarmen();
    await expect(cancelarPedidoDeCobro(julio, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect((await cancelarPedidoDeCobro(carmen, id)).aplicado).toBe(true);
    expect((await cancelarPedidoDeCobro(carmen, id)).aplicado).toBe(false);
    expect((await miCuota(carmen))!.cobroEnCasa).toBeNull();
    expect((await cobrosEnCasaPorAtender(marta)).items).toEqual([]);
    expect((await pedir(carmen)).creado).toBe(true);
  });
});

describe("@HU-COB-11 La directiva ve el pedido para ir a cobrar", () => {
  it("@HU-COB-11 CA1 Cobros lista los pedidos por atender; el mediador los ve pero no cobra; el vecino no", async () => {
    const id = await pedidoDeCarmen();
    expect((await cobrosEnCasaPorAtender(marta)).items).toEqual([
      {
        id,
        numero: "C-001",
        nombre: "Carmen Huamán",
        vivienda: "Mz. C, lote 7",
        franja: "Mañana, de 8:00 a. m. a 12:00 m.",
        fecha: "22 de setiembre de 2026",
        monto: 1500,
        esSuyo: false,
        puedeCobrar: true,
      },
    ]);
    expect((await cobrosEnCasaPorAtender(pedro)).items[0].puedeCobrar).toBe(false);
    await expect(cobrosEnCasaPorAtender(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-11 CA1 «Cobrar en casa» trae su teléfono, lo que pidió pagar y lo que debe hoy", async () => {
    const id = await pedidoDeCarmen({ nota: "Tocar el timbre" });
    expect(await verPedidoDeCobro(marta, id)).toMatchObject({
      numero: "C-001",
      nombre: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      franja: "Mañana, de 8:00 a. m. a 12:00 m.",
      nota: "Tocar el timbre",
      monto: 1500,
      semanas: "3 semanas, del 7 al 27 de setiembre",
      debe: 1500,
      puedeCobrar: true,
      pendiente: true,
    });
    expect((await verPedidoDeCobro(marta, id)).telefono).toMatch(/^\+?\d+$/);
    expect((await verPedidoDeCobro(pedro, id)).puedeCobrar).toBe(false);
    await expect(verPedidoDeCobro(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-COB-11 CA1 Registrar el cobro en efectivo", () => {
  it("@HU-COB-11 CA1 cobrar todo deja el pago aprobado, las cuotas pagadas, la garita en verde y el recibo emitido y enviado", async () => {
    const casa = await garitaDe("08123478");
    await prisma.predio.update({ where: { id: casa.id }, data: { estadoGarita: "ROJO" } });
    const id = await pedidoDeCarmen();
    const r = await cobrar(id);
    expect(r).toMatchObject({
      aplicado: true,
      nombre: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      monto: 1500,
      excedente: 0,
      debeAhora: 0,
      alDia: true,
      reciboEnPapel: false,
      registradoPor: "Marta Rojas",
      recibo: {
        numero: "000001",
        titular: "Carmen Huamán",
        concepto: "Cuota de vigilancia: 3 semanas, del 7 al 27 de setiembre",
        medio: "Efectivo, en su casa",
        monto: 1500,
        fecha: "24 de setiembre de 2026",
        registradoPor: "Marta Rojas",
      },
    });
    expect(r.recibo?.enviado).not.toBeNull();

    const pago = await prisma.pago.findFirstOrThrow({ include: { cuotas: true, comprobantes: true } });
    expect(pago).toMatchObject({ medio: "EFECTIVO", estado: "APROBADO", monto: 1500 });
    expect(pago.comprobantes).toEqual([]);
    expect(pago.creadoEn).toEqual(new Date(COBRO));
    const cuotas = await prisma.cuota.findMany({ where: { predioId: casa.id } });
    expect(cuotas.map((c) => [c.estado, c.saldoPendiente])).toEqual([
      ["PAGADA", 0],
      ["PAGADA", 0],
      ["PAGADA", 0],
    ]);
    expect((await garitaDe("08123478")).estadoGarita).toBe("VERDE");
    expect(await prisma.pedidoCobroEnCasa.findUniqueOrThrow({ where: { id } })).toMatchObject({
      estado: "COBRADO",
      pagoId: pago.id,
    });
    expect((await comprobantesPorRevisar(marta)).items).toEqual([]);
  });

  it("@HU-COB-11 CA1 la vecina recibe el aviso con su recibo y lo ve en Mis pagos como aprobado, en efectivo", async () => {
    const id = await pedidoDeCarmen();
    const r = await cobrar(id);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su pago fue aprobado" },
    });
    expect(aviso.texto).toBe(
      "Recibimos su pago de S/ 15.00. Ya está al día. Gracias. Su recibo N.° 000001 ya está en Mis pagos y recibos.",
    );
    const [pago] = (await misPagos(carmen)).pagos;
    expect(pago).toMatchObject({
      estado: "Aprobado",
      monto: 1500,
      recibo: { id: r.recibo!.id, numero: "000001" },
    });
    expect(pago.detalle).toContain("Efectivo, en su casa");
    expect(await miCuota(carmen)).toMatchObject({ debe: 0, cobroEnCasa: null });
  });

  it("@HU-COB-11 CA1 «Otro monto»: lo recibido paga las semanas más antiguas y queda el saldo", async () => {
    const id = await pedidoDeCarmen();
    const r = await cobrar(id, { monto: 750 });
    expect(r).toMatchObject({ debeAhora: 750, alDia: false, excedente: 0 });
    expect(r.recibo?.concepto).toBe(
      "Cuota de vigilancia: 2 semanas, del 7 al 20 de setiembre (abono parcial)",
    );
    const cuotas = await prisma.cuota.findMany({
      where: { predioId: (await garitaDe("08123478")).id },
      orderBy: { periodo: "asc" },
    });
    expect(cuotas.map((c) => [c.estado, c.saldoPendiente])).toEqual([
      ["PAGADA", 0],
      ["VENCIDA", 250],
      ["PENDIENTE", 500],
    ]);
  });

  it("@HU-COB-11 CA2 si al sincronizar la casa ya no debía tanto, el excedente no se pierde: queda dicho", async () => {
    const id = await pedidoDeCarmen();
    const r = await cobrar(id, { monto: 2000 });
    expect(r).toMatchObject({ aplicado: true, monto: 2000, excedente: 500, debeAhora: 0 });
    expect(r.recibo?.monto).toBe(2000);
    const pago = await prisma.pago.findFirstOrThrow({ include: { cuotas: true } });
    expect(pago.cuotas.reduce((suma, c) => suma + c.monto, 0)).toBe(1500);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_cobro_en_efectivo", entidadId: pago.id },
    });
    expect(auditoria.despues).toMatchObject({ excedente: "S/ 5.00", recibo: "000001" });
  });

  it("@HU-COB-11 CA1 con «recibo en papel», el recibo queda por entregar en la próxima visita", async () => {
    const id = await pedidoDeCarmen();
    const r = await cobrar(id, { reciboEnPapel: true });
    expect(r.reciboEnPapel).toBe(true);
    const { items } = await recibosEnPapelPorEntregar(marta);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reciboId: r.recibo?.id,
      nombre: "Carmen Huamán",
      recibo: "Recibo N.° 000001 · S/ 15.00",
      franja: "Mañana, de 8:00 a. m. a 12:00 m.",
    });
  });

  it("@HU-COB-11 AC-6 el cobro queda en la auditoría con quién lo registró", async () => {
    const id = await pedidoDeCarmen();
    await cobrar(id);
    const pago = await prisma.pago.findFirstOrThrow();
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_cobro_en_efectivo", entidadId: pago.id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      despues: { monto: "S/ 15.00", debeAhora: "S/ 0.00" },
    });
  });

  it("@HU-COB-11 la hora del cobro es la del teléfono, y si viene del futuro vale la de llegada", async () => {
    const id = await pedidoDeCarmen();
    const r = await cobrar(id, { registradoEn: "2030-01-01T00:00:00Z" });
    expect(r.recibo?.fecha).toBe("25 de setiembre de 2026");
  });
});

describe("@HU-COB-11 CA2 Sincronizar sin duplicar", () => {
  it("@HU-COB-11 AC-5 mandar el mismo cobro dos veces no abona, ni emite recibo, ni avisa dos veces", async () => {
    const id = await pedidoDeCarmen();
    const idOperacionLocal = randomUUID();
    const primero = await cobrar(id, { idOperacionLocal });
    const repetido = await cobrar(id, { idOperacionLocal });
    expect(repetido).toMatchObject({
      aplicado: false,
      pagoId: primero.pagoId,
      debeAhora: 0,
      nombre: "Carmen Huamán",
      recibo: { id: primero.recibo?.id },
    });
    expect(await prisma.pago.count()).toBe(1);
    expect(await prisma.recibo.count()).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su pago fue aprobado" } })).toBe(1);
    expect(
      await prisma.registroAuditoria.count({
        where: { accion: "registrar_cobro_en_efectivo", entidadId: primero.pagoId },
      }),
    ).toBe(1);
  });

  it("@HU-COB-11 AC-5 dos envíos a la vez del mismo cobro dejan uno solo", async () => {
    const id = await pedidoDeCarmen();
    const idOperacionLocal = randomUUID();
    const resultados = await Promise.all([
      cobrar(id, { idOperacionLocal }),
      cobrar(id, { idOperacionLocal }),
    ]);
    expect(resultados.map((r) => r.aplicado).sort()).toEqual([false, true]);
    expect(await prisma.pago.count()).toBe(1);
    expect((await miCuota(carmen))!.debe).toBe(0);
  });

  it("@HU-COB-11 AC-7 otra persona no reusa el identificador de un cobro ajeno", async () => {
    const id = await pedidoDeCarmen();
    const idOperacionLocal = randomUUID();
    await cobrar(id, { idOperacionLocal });
    await expect(cobrar(id, { idOperacionLocal }, pedro)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-11 un pedido que ya se cobró (con otro identificador) no se cobra otra vez", async () => {
    const id = await pedidoDeCarmen();
    await cobrar(id);
    await expect(cobrar(id)).rejects.toBeInstanceOf(ErrorReglaNegocio);
    expect(await prisma.pago.count()).toBe(1);
  });
});

describe("@HU-COB-11 Reglas", () => {
  it("@HU-COB-11 solo la directiva cobra: ni el mediador ni el vecino", async () => {
    const id = await pedidoDeCarmen();
    await expect(cobrar(id, {}, pedro)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(cobrar(id, {}, carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(cobrar(randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect(await prisma.pago.count()).toBe(0);
  });

  it("@HU-COB-11 el monto es entero y mayor que cero", async () => {
    const id = await pedidoDeCarmen();
    await expect(cobrar(id, { monto: 0 })).rejects.toMatchObject({
      campos: { monto: "Escriba cuánto recibió, mayor que cero." },
    });
    await expect(cobrar(id, { monto: -10 })).rejects.toBeInstanceOf(ErrorValidacion);
  });

  it("@HU-COB-11 el cobro de la propia casa de quien lo registra lo hace otro miembro", async () => {
    const { pedido } = await pedir(marta);
    expect((await cobrosEnCasaPorAtender(marta)).items[0]).toMatchObject({
      esSuyo: true,
      puedeCobrar: false,
    });
    await expect(cobrar(pedido.id)).rejects.toThrow(/lo registra otro miembro/);
  });
});

describe("@HU-COB-11 Endpoints", () => {
  const llamar = (
    manejador: (peticion: Request, contexto: { params: Promise<{ id: string }> }) => Promise<Response>,
    ruta: string,
    token: string | null,
    cuerpo?: unknown,
    metodo = "POST",
    id = "x",
  ) =>
    manejador(
      new Request(`http://localhost${ruta}`, {
        method: metodo,
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      }),
      { params: Promise.resolve({ id }) },
    );

  it("@HU-COB-11 POST /api/aportes/pagos/presencial registra (201), repetirlo responde 200; sin permiso 403, sin sesión 401", async () => {
    const id = await pedidoDeCarmen();
    const cuerpo = { idOperacionLocal: randomUUID(), pedidoId: id, monto: 1500, reciboEnPapel: false };
    const primera = await llamar(cobrarHttp, "/api/aportes/pagos/presencial", tokenMarta, cuerpo);
    expect(primera.status).toBe(201);
    expect(await primera.json()).toMatchObject({ aplicado: true, alDia: true });
    const repetida = await llamar(cobrarHttp, "/api/aportes/pagos/presencial", tokenMarta, cuerpo);
    expect(repetida.status).toBe(200);
    expect((await repetida.json()).aplicado).toBe(false);
    expect((await llamar(cobrarHttp, "/api/aportes/pagos/presencial", tokenAna, cuerpo)).status).toBe(403);
    expect((await llamar(cobrarHttp, "/api/aportes/pagos/presencial", null, cuerpo)).status).toBe(401);
    const sinMonto = await llamar(cobrarHttp, "/api/aportes/pagos/presencial", tokenMarta, {
      ...cuerpo,
      monto: 0,
      idOperacionLocal: randomUUID(),
    });
    expect(sinMonto.status).toBe(400);
  });

  it("@HU-COB-11 POST /api/aportes/cobros-en-casa pide (201) y PATCH …/cancelar lo cancela, sin ser vecino 403", async () => {
    // Marta pide desde su casa: aquí solo se prueba la ruta, no el cobro.
    const cuerpo = { semanas: 1, franja: "TARDE", idOperacion: randomUUID() };
    expect((await llamar(pedirHttp, "/api/aportes/cobros-en-casa", tokenAna, cuerpo)).status).toBe(403);
    const pedida = await llamar(pedirHttp, "/api/aportes/cobros-en-casa", tokenMarta, cuerpo);
    expect(pedida.status).toBe(201);
    const { id } = await pedida.json();
    expect((await llamar(pedirHttp, "/api/aportes/cobros-en-casa", tokenMarta, cuerpo)).status).toBe(200);
    const ruta = `/api/aportes/cobros-en-casa/${id}/cancelar`;
    const cancelada = await llamar(cancelarHttp, ruta, tokenMarta, undefined, "PATCH", id);
    expect(cancelada.status).toBe(200);
    expect(await cancelada.json()).toMatchObject({ aplicado: true });
  });
});
