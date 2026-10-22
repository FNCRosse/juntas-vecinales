import { randomUUID } from "node:crypto";
import { PATCH as aprobarHttp } from "@/app/api/aportes/comprobantes/[id]/aprobar/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import {
  aprobarComprobante,
  comprobantesPorRevisar,
  misPagos,
  registrarPagoDigital,
  verComprobante,
} from "@/modulos/aportes/aplicacion/pagos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const ENVIO = new Date("2026-09-22T15:18:00Z");
const REVISION = new Date("2026-09-23T14:00:00Z");

let carmen: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const foto = (sesion: SesionDto) =>
  prisma.archivo
    .create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso: "comprobante_pago",
        subidoPor: sesion.usuarioId,
      },
    })
    .then((a) => a.id);

/** La casa manda su pago y devuelve el id del comprobante que espera revisión. */
async function pagar(
  sesion: SesionDto,
  semanas: number,
  medio: "YAPE_O_PLIN" | "TRANSFERENCIA" = "YAPE_O_PLIN",
) {
  await registrarPagoDigital(
    sesion,
    { semanas, medio, archivoId: await foto(sesion), idOperacion: randomUUID() },
    ENVIO,
  );
  const comprobante = await prisma.comprobante.findFirstOrThrow({
    where: { pago: { autorId: sesion.usuarioId }, estado: "PENDIENTE_REVISION" },
    orderBy: { creadoEn: "desc" },
  });
  return comprobante.id;
}

const garitaDe = async (dni: string) => {
  const r = await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } });
  return prisma.predio.findUniqueOrThrow({ where: { id: r.predioId } });
};

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  carmen = await sesionDe("08123478");
  marta = await sesionDe("40000002");
  pedro = await sesionDe("40000003");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-09 CA1 Revisar un comprobante", () => {
  it("@HU-COB-09 CA1 junto a la captura se ve el monto, lo que debe la casa, la fecha y la cuenta de destino", async () => {
    const id = await pagar(carmen, 3);
    const c = await verComprobante(marta, id);
    expect(c).toMatchObject({
      id,
      nombre: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      monto: 1500,
      debe: 1500,
      semanas: "3 semanas, del 7 al 27 de setiembre",
      medio: "Yape o Plin",
      enviado: "22 de setiembre de 2026 a las 10:18 a. m.",
      cuentaDeDestino: "Yape o Plin: 987 654 321, a nombre de Junta Vecinal",
      cubre: "Cubre el 100 %",
      efecto: "Si lo aprueba, el pago queda Aprobado y la casa pasa a Al día.",
      archivo: { id: expect.any(String), tipo: "image/jpeg" },
      puedeAprobar: true,
      esSuyo: false,
    });
  });

  it("@HU-COB-09 CA1 CA3 si el pago cubre solo una parte de lo que debe, lo dice y avisa cuánto quedaría", async () => {
    const id = await pagar(carmen, 1, "TRANSFERENCIA");
    const c = await verComprobante(marta, id);
    expect(c).toMatchObject({
      monto: 500,
      debe: 1500,
      cubre: "Cubre una parte: S/ 5.00 de S/ 15.00",
      efecto: "Si lo aprueba, el pago queda Aprobado y la casa todavía debe S/ 10.00.",
      cuentaDeDestino: "Cuenta bancaria: 191-2345678-0-12",
    });
  });

  it("@HU-COB-09 CA1 el mediador revisa la captura pero no puede aprobar; el vecino ni la ve", async () => {
    const id = await pagar(carmen, 3);
    expect((await verComprobante(pedro, id)).puedeAprobar).toBe(false);
    await expect(verComprobante(carmen, id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(verComprobante(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-09 el pago de quien revisa lo revisa otro miembro de la directiva", async () => {
    const id = await pagar(marta, 1);
    expect(await verComprobante(marta, id)).toMatchObject({ esSuyo: true, puedeAprobar: false });
    await expect(aprobarComprobante(marta, id, REVISION)).rejects.toThrow(/lo revisa otro miembro/);
    expect((await prisma.pago.findFirstOrThrow({ where: { autorId: marta.usuarioId } })).estado).toBe(
      "REGISTRADO",
    );
  });
});

describe("@HU-COB-09 CA2 Aprobar un pago que cubre todo", () => {
  it("@HU-COB-09 CA2 el pago queda aprobado, las cuotas pagadas, la casa al día y la garita restituida", async () => {
    const casa = await garitaDe("08123478");
    await prisma.predio.update({ where: { id: casa.id }, data: { estadoGarita: "ROJO" } });
    const id = await pagar(carmen, 3);

    const resultado = await aprobarComprobante(marta, id, REVISION);
    expect(resultado).toMatchObject({
      aplicado: true,
      nombre: "Carmen Huamán",
      monto: 1500,
      debeAhora: 0,
      alDia: true,
    });
    const pago = await prisma.pago.findFirstOrThrow({ include: { comprobantes: true } });
    expect(pago.estado).toBe("APROBADO");
    expect(pago.comprobantes[0].estado).toBe("APROBADO");
    const cuotas = await prisma.cuota.findMany({ where: { predioId: casa.id } });
    expect(cuotas.map((c) => [c.estado, c.saldoPendiente])).toEqual([
      ["PAGADA", 0],
      ["PAGADA", 0],
      ["PAGADA", 0],
    ]);
    expect((await garitaDe("08123478")).estadoGarita).toBe("VERDE");
  });

  it("@HU-COB-09 CA2 la vecina ve que está al día, sus semanas pasan al historial y su pago figura aprobado", async () => {
    const id = await pagar(carmen, 3);
    await aprobarComprobante(marta, id, REVISION);
    const cuota = (await miCuota(carmen))!;
    expect(cuota).toMatchObject({ debe: 0, semanas: [], enRevision: null, puedePagar: false });
    expect(cuota.historial).toHaveLength(3);
    expect((await misPagos(carmen)).pagos[0]).toMatchObject({ estado: "Aprobado", monto: 1500 });
  });

  it("@HU-COB-09 CA2 la vecina recibe el aviso de que su pago fue aprobado y quedó al día", async () => {
    const id = await pagar(carmen, 3);
    await aprobarComprobante(marta, id, REVISION);
    const [aviso, ...otros] = await prisma.avisoEnCola.findMany({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su pago fue aprobado" },
    });
    expect(otros).toEqual([]);
    expect(aviso).toMatchObject({
      tipo: "PAGOS",
      texto: "Recibimos su pago de S/ 15.00. Ya está al día. Gracias.",
    });
  });

  it("@HU-COB-09 AC-6 la aprobación queda en la auditoría con quién la hizo", async () => {
    const id = await pagar(carmen, 3);
    await aprobarComprobante(marta, id, REVISION);
    const pago = await prisma.pago.findFirstOrThrow();
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "aprobar_pago", entidadId: pago.id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      despues: { monto: "S/ 15.00", debeAhora: "S/ 0.00" },
    });
  });

  it("@HU-COB-09 un pago aprobado sale de la bandeja de comprobantes por revisar", async () => {
    const id = await pagar(carmen, 3);
    expect((await comprobantesPorRevisar(marta)).items).toHaveLength(1);
    await aprobarComprobante(marta, id, REVISION);
    expect((await comprobantesPorRevisar(marta)).items).toEqual([]);
  });
});

describe("@HU-COB-09 CA3 Aprobar un pago parcial", () => {
  it("@HU-COB-09 CA3 se registra el abono, queda el saldo que falta y se avisa lo que todavía debe", async () => {
    const id = await pagar(carmen, 1);
    const resultado = await aprobarComprobante(marta, id, REVISION);
    expect(resultado).toMatchObject({ aplicado: true, debeAhora: 1000, alDia: false });
    const cuota = (await miCuota(carmen))!;
    expect(cuota.debe).toBe(1000);
    expect(cuota.historial).toHaveLength(1);
    expect(cuota.semanas).toHaveLength(2);
    expect(cuota.puedePagar).toBe(true);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su pago fue aprobado" },
    });
    expect(aviso.texto).toBe(
      "Recibimos su pago de S/ 5.00. Todavía le faltan S/ 10.00 de su cuota. Puede pagarlo cuando pueda.",
    );
  });

  it("@HU-COB-09 CA3 con lo que queda al día o en pocos días de atraso, la garita se restituye", async () => {
    const casa = await garitaDe("08123478");
    await prisma.predio.update({ where: { id: casa.id }, data: { estadoGarita: "ROJO" } });
    const id = await pagar(carmen, 1);
    await aprobarComprobante(marta, id, new Date("2026-09-28T14:00:00Z"));
    expect((await garitaDe("08123478")).estadoGarita).toBe("VERDE");
  });

  it("@HU-COB-09 CA3 si todavía le quedan 8 semanas o más de atraso, la garita sigue suspendida", async () => {
    const casa = await garitaDe("08123478");
    await prisma.predio.update({ where: { id: casa.id }, data: { estadoGarita: "ROJO" } });
    const id = await pagar(carmen, 1);
    await aprobarComprobante(marta, id, new Date("2026-12-01T14:00:00Z"));
    expect((await garitaDe("08123478")).estadoGarita).toBe("ROJO");
  });
});

describe("@HU-COB-09 Reglas", () => {
  it("@HU-COB-09 AC-5 aprobar dos veces no abona dos veces ni avisa dos veces", async () => {
    const id = await pagar(carmen, 1);
    await aprobarComprobante(marta, id, REVISION);
    const otra = await aprobarComprobante(marta, id, REVISION);
    expect(otra.aplicado).toBe(false);
    expect((await miCuota(carmen))!.debe).toBe(1000);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su pago fue aprobado" } })).toBe(1);
    const pago = await prisma.pago.findFirstOrThrow();
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "aprobar_pago", entidadId: pago.id } }),
    ).toBe(1);
  });

  it("@HU-COB-09 solo la directiva aprueba: ni el mediador ni el vecino", async () => {
    const id = await pagar(carmen, 3);
    await expect(aprobarComprobante(pedro, id, REVISION)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(aprobarComprobante(carmen, id, REVISION)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(aprobarComprobante(marta, randomUUID(), REVISION)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect((await prisma.pago.findFirstOrThrow()).estado).toBe("REGISTRADO");
  });

  it("@HU-COB-09 un pago que ya no está en revisión no se aprueba", async () => {
    const id = await pagar(carmen, 1);
    await prisma.pago.updateMany({ data: { estado: "RECHAZADO" } });
    await expect(aprobarComprobante(marta, id, REVISION)).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });
});

describe("@HU-COB-09 Endpoint", () => {
  const pedir = (id: string, token: string | null) =>
    new Request(`http://localhost/api/aportes/comprobantes/${id}/aprobar`, {
      method: "PATCH",
      headers: token ? { cookie: `sesion=${token}` } : {},
    });

  it("@HU-COB-09 PATCH /api/aportes/comprobantes/{id}/aprobar aprueba (200) y repetirlo no abona otra vez", async () => {
    const id = await pagar(carmen, 3);
    const respuesta = await aprobarHttp(pedir(id, tokenMarta), { params: Promise.resolve({ id }) });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ aplicado: true, alDia: true, debeAhora: 0 });
    const otra = await aprobarHttp(pedir(id, tokenMarta), { params: Promise.resolve({ id }) });
    expect((await otra.json()).aplicado).toBe(false);
  });

  it("@HU-COB-09 sin sesión responde 401 y sin ser directiva, 403", async () => {
    const id = await pagar(carmen, 3);
    expect((await aprobarHttp(pedir(id, null), { params: Promise.resolve({ id }) })).status).toBe(401);
    expect((await aprobarHttp(pedir(id, tokenAna), { params: Promise.resolve({ id }) })).status).toBe(403);
  });
});
