import { randomUUID } from "node:crypto";
import { GET as constanciaHttp } from "@/app/api/aportes/ajustes/[id]/constancia/route";
import { POST as reclamarHttp } from "@/app/api/aportes/ajustes/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { alertarMorosidad, suspenderCasasConAtrasoCritico } from "@/modulos/aportes/aplicacion/morosidad";
import { datosParaPagar } from "@/modulos/aportes/aplicacion/pagos";
import {
  constanciaDeReclamo,
  datosParaReclamar,
  registrarReclamo,
  USO_SUSTENTO_RECLAMO,
  verMiReclamo,
} from "@/modulos/aportes/aplicacion/reclamos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir las cuotas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada o corre con cobertura.
jest.setTimeout(30_000);

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const RECLAMA = new Date("2026-09-22T15:21:00Z");

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;
const cuotasDe = async (predioId: string) =>
  prisma.cuota.findMany({ where: { predioId }, orderBy: { periodo: "asc" } });

const sustento = (sesion: SesionDto, uso = USO_SUSTENTO_RECLAMO) =>
  prisma.archivo
    .create({
      data: {
        clave: `comprobantes/${randomUUID()}.pdf`,
        tipo: "application/pdf",
        tamano: 1000,
        uso,
        subidoPor: sesion.usuarioId,
      },
    })
    .then((a) => a.id);

const reclamar = (
  sesion: SesionDto,
  extra: Partial<{ motivo: string; detalle: string; archivoId: string; idOperacion: string }> = {},
) => registrarReclamo(sesion, { motivo: "SIN_INQUILINO", idOperacion: randomUUID(), ...extra }, RECLAMA);

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [carmen, julio, marta] = await Promise.all(["08123478", "40000006", "40000002"].map(sesionDe));
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-03 CA1 El formulario", () => {
  it("@HU-COB-03 CA1 dice qué cuota se reclama y ofrece los motivos del prototipo", async () => {
    const datos = await datosParaReclamar(carmen);
    expect(datos.cuota).toBe("S/ 5.00 por semana (casa + 1 inquilino)");
    expect(datos.motivos).toEqual([
      { valor: "SIN_INQUILINO", etiqueta: "Ya no tengo inquilino" },
      { valor: "MENOS_VEHICULOS", etiqueta: "Tengo menos autos o motos de lo que figura" },
      { valor: "YA_PAGUE", etiqueta: "Ya pagué y no aparece" },
      { valor: "OTRO", etiqueta: "Otro motivo" },
    ]);
    expect(datos.abierto).toBeNull();
  });

  it("@HU-COB-03 CA1 hay que elegir un motivo; «otro motivo» pide contar cuál", async () => {
    await expect(reclamar(carmen, { motivo: "" })).rejects.toMatchObject({
      campos: { motivo: "Elija por qué cree que su cuota no es correcta." },
    });
    await expect(reclamar(carmen, { motivo: "OTRO", detalle: " " })).rejects.toMatchObject({
      campos: { detalle: "Cuéntenos cuál es el motivo." },
    });
    await expect(reclamar(carmen, { detalle: "a".repeat(301) })).rejects.toBeInstanceOf(ErrorValidacion);
    expect(await prisma.solicitudAjusteTarifa.count()).toBe(0);
  });

  it("@HU-COB-03 CA1 el documento es opcional, pero si se adjunta tiene que ser un archivo propio para ese fin", async () => {
    const ok = await reclamar(carmen, { archivoId: await sustento(carmen) });
    expect(ok.reclamo.conDocumento).toBe(true);
    await prisma.reclamoCuota.deleteMany();
    await prisma.solicitudAjusteTarifa.deleteMany();
    await prisma.cuota.updateMany({ data: { estado: "PENDIENTE" } });
    for (const archivoId of [
      randomUUID(),
      await sustento(julio),
      await sustento(carmen, "comprobante_pago"),
    ]) {
      await expect(reclamar(carmen, { archivoId })).rejects.toMatchObject({
        campos: { archivoId: expect.stringContaining("foto o un PDF") },
      });
    }
  });
});

describe("@HU-COB-03 CA2 Enviar el reclamo", () => {
  it("@HU-COB-03 CA2 el reclamo queda en revisión y sus cuotas pasan a «En discrepancia»", async () => {
    const { reclamo, creado } = await reclamar(carmen, { detalle: "Se mudó en agosto" });
    expect(creado).toBe(true);
    expect(reclamo).toMatchObject({
      numero: "R-0001",
      motivo: "Ya no tengo inquilino",
      detalle: "Se mudó en agosto",
      conDocumento: false,
      estado: "En revisión",
      enviado: "22 de setiembre de 2026 a las 10:21 a. m.",
    });
    const cuotas = await cuotasDe(await predioDe("08123478"));
    expect(cuotas.map((c) => [c.estado, c.saldoPendiente])).toEqual([
      ["EN_DISCREPANCIA", 500],
      ["EN_DISCREPANCIA", 500],
      ["EN_DISCREPANCIA", 500],
    ]);
    // Guarda el estado en que estaban, para devolverlo si el importe se mantiene (HU-COB-04).
    const afectadas = await prisma.reclamoCuota.findMany({ orderBy: { estadoAnterior: "asc" } });
    expect(afectadas.map((a) => a.estadoAnterior).sort()).toEqual(["PENDIENTE", "VENCIDA", "VENCIDA"]);
    const cuota = (await miCuota(carmen))!;
    expect(cuota.semanas.map((s) => s.estado)).toEqual(["En revisión", "En revisión", "En revisión"]);
    expect(cuota.reclamoEnRevision).toEqual({ id: reclamo.id, numero: "R-0001" });
  });

  it("@HU-COB-03 CA2 se avisa a la directiva, queda en la auditoría y la deuda no cambia", async () => {
    const antes = (await miCuota(carmen))!.debe;
    const { reclamo } = await reclamar(carmen);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: marta.usuarioId, titulo: "Un vecino reclamó su cuota" },
    });
    expect(aviso).toMatchObject({
      tipo: "PAGOS",
      texto:
        "Carmen Huamán (Mz. C, lote 7) reclamó el monto de su cuota: ya no tengo inquilino. Reclamo R-0001. Véalo en Cobros.",
    });
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "registrar_reclamo", entidadId: reclamo.id } }),
    ).toBe(1);
    expect((await miCuota(carmen))!.debe).toBe(antes);
  });

  it("@HU-COB-03 la casa puede seguir pagando mientras tanto: lo que reclama no la obliga, pero tampoco se lo impide", async () => {
    await reclamar(carmen);
    const datos = await datosParaPagar(carmen);
    expect(datos.opciones.length).toBeGreaterThan(0);
  });

  it("@HU-COB-03 con un reclamo en revisión no se le avisa de atraso ni se le suspende la reja por esas semanas", async () => {
    await reclamar(carmen);
    await prisma.predio.updateMany({ data: { estadoGarita: "VERDE" } });
    const casa = await predioDe("08123478");
    await alertarMorosidad(new Date("2026-09-28T15:00:00Z"));
    expect(
      await prisma.avisoEnCola.count({
        where: { destinatarioId: carmen.usuarioId, titulo: "Un recordatorio amable sobre su cuota" },
      }),
    ).toBe(0);
    await suspenderCasasConAtrasoCritico(new Date("2026-12-01T15:00:00Z"));
    expect((await prisma.predio.findUniqueOrThrow({ where: { id: casa } })).estadoGarita).toBe("VERDE");
  });
});

describe("@HU-COB-03 CA3 Un solo reclamo abierto", () => {
  it("@HU-COB-03 CA3 mientras hay uno en revisión no se puede hacer otro, y se dice cuál", async () => {
    const primero = await reclamar(carmen);
    await expect(reclamar(carmen, { motivo: "YA_PAGUE" })).rejects.toThrow(/Ya tiene un reclamo en revisión/);
    expect(await prisma.solicitudAjusteTarifa.count()).toBe(1);
    expect((await datosParaReclamar(carmen)).abierto).toEqual({
      id: primero.reclamo.id,
      numero: "R-0001",
      fecha: "22 de setiembre de 2026",
    });
  });

  it("@HU-COB-03 CA3 una vez respondido, la casa puede reclamar otra vez", async () => {
    const { reclamo } = await reclamar(carmen);
    await prisma.solicitudAjusteTarifa.update({ where: { id: reclamo.id }, data: { estado: "RECHAZADO" } });
    await prisma.cuota.updateMany({ data: { estado: "PENDIENTE" } });
    expect((await reclamar(carmen, { motivo: "YA_PAGUE" })).reclamo.numero).toBe("R-0002");
  });

  it("@HU-COB-03 sin cuotas pendientes no hay nada que reclamar", async () => {
    await prisma.cuota.updateMany({
      where: { predioId: await predioDe("08123478") },
      data: { estado: "PAGADA", saldoPendiente: 0 },
    });
    await expect(reclamar(carmen)).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });

  it("@HU-COB-03 el reclamo de otra casa no cuenta: cada casa tiene el suyo", async () => {
    await reclamar(carmen);
    expect((await reclamar(julio)).creado).toBe(true);
    expect(await prisma.solicitudAjusteTarifa.count({ where: { estado: "EN_REVISION" } })).toBe(2);
  });
});

describe("@HU-COB-03 Reglas", () => {
  it("@HU-COB-03 AC-5 repetir el mismo reclamo devuelve el anterior sin avisar otra vez; otra casa no lo ve", async () => {
    const idOperacion = randomUUID();
    const primero = await reclamar(carmen, { idOperacion });
    const avisos = () => prisma.avisoEnCola.count({ where: { titulo: "Un vecino reclamó su cuota" } });
    const antes = await avisos();
    const repetido = await reclamar(carmen, { idOperacion });
    expect(repetido).toMatchObject({ creado: false, reclamo: { id: primero.reclamo.id } });
    expect(await avisos()).toBe(antes);
    await expect(reclamar(julio, { idOperacion })).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-03 AC-5 dos envíos a la vez dejan un solo reclamo", async () => {
    const idOperacion = randomUUID();
    const resultados = await Promise.allSettled([
      reclamar(carmen, { idOperacion }),
      reclamar(carmen, { idOperacion }),
    ]);
    expect(await prisma.solicitudAjusteTarifa.count()).toBe(1);
    expect(resultados.filter((r) => r.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
  });

  it("@HU-COB-03 AC-7 la casa ve y baja la constancia de su reclamo, y otra casa recibe «no existe»", async () => {
    const { reclamo } = await reclamar(carmen);
    expect(await verMiReclamo(carmen, reclamo.id)).toMatchObject({ numero: "R-0001", estado: "En revisión" });
    const { pdf, nombreArchivo } = await constanciaDeReclamo(carmen, reclamo.id);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(nombreArchivo).toBe("reclamo-R-0001.pdf");
    await expect(verMiReclamo(julio, reclamo.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(constanciaDeReclamo(julio, reclamo.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(verMiReclamo(carmen, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-03 solo quienes viven en una casa reclaman: el administrador no", async () => {
    const ana = await sesionDe("40000001");
    await expect(reclamar(ana)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(datosParaReclamar(ana)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-COB-03 Endpoints", () => {
  const pedir = (token: string | null, cuerpo: unknown) =>
    reclamarHttp(
      new Request("http://localhost/api/aportes/ajustes", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: JSON.stringify(cuerpo),
      }),
      undefined,
    );

  it("@HU-COB-03 POST /api/aportes/ajustes envía (201), repetirlo responde 200, otro reclamo 422; sin motivo 400; 401 y 403", async () => {
    const cuerpo = { motivo: "MENOS_VEHICULOS", idOperacion: randomUUID() };
    const primera = await pedir(tokenMarta, cuerpo);
    expect(primera.status).toBe(201);
    const reclamo = await primera.json();
    expect(reclamo).toMatchObject({ numero: "R-0001", estado: "En revisión" });
    expect((await pedir(tokenMarta, cuerpo)).status).toBe(200);
    expect((await pedir(tokenMarta, { ...cuerpo, idOperacion: randomUUID() })).status).toBe(422);
    expect((await pedir(tokenMarta, { motivo: "", idOperacion: randomUUID() })).status).toBe(400);
    expect((await pedir(null, cuerpo)).status).toBe(401);
    expect((await pedir(tokenAna, cuerpo)).status).toBe(403);

    const constancia = await constanciaHttp(
      new Request(`http://localhost/api/aportes/ajustes/${reclamo.id}/constancia`, {
        headers: { cookie: `sesion=${tokenMarta}` },
      }),
      { params: Promise.resolve({ id: reclamo.id }) },
    );
    expect(constancia.status).toBe(200);
    expect(constancia.headers.get("content-type")).toBe("application/pdf");
  });
});
