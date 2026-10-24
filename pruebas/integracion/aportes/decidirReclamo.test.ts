import { randomUUID } from "node:crypto";
import { PATCH as decidirHttp } from "@/app/api/aportes/ajustes/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import {
  decidirReclamo,
  reclamosPorAtender,
  verReclamoParaDecidir,
} from "@/modulos/aportes/aplicacion/decidirReclamos";
import { registrarReclamo, USO_SUSTENTO_RECLAMO, verMiReclamo } from "@/modulos/aportes/aplicacion/reclamos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir las cuotas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada o corre con cobertura.
jest.setTimeout(30_000);

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const LUNES_28 = new Date("2026-09-28T15:00:00Z");
const RECLAMA = new Date("2026-09-22T15:21:00Z");
const RESPONDE = new Date("2026-09-23T15:00:00Z");

let carmen: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;
const cuotasDe = async (dni: string) =>
  prisma.cuota.findMany({ where: { predioId: await predioDe(dni) }, orderBy: { periodo: "asc" } });

/** Carmen reclama y devuelve el id del reclamo. */
const reclamoDeCarmen = async (motivo = "SIN_INQUILINO", sesion = carmen) =>
  (await registrarReclamo(sesion, { motivo, idOperacion: randomUUID() }, RECLAMA)).reclamo.id;

const decidir = (id: string, decision: string, motivo?: string, sesion = marta) =>
  decidirReclamo(sesion, id, { decision, motivo }, RESPONDE);

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [carmen, marta, pedro] = await Promise.all(["08123478", "40000002", "40000003"].map(sesionDe));
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-04 CA1 Auditar el reclamo", () => {
  it("@HU-COB-04 CA1 Cobros lista los reclamos por atender; el mediador los ve sin poder decidir; el vecino no", async () => {
    const id = await reclamoDeCarmen();
    expect((await reclamosPorAtender(marta)).items).toEqual([
      {
        id,
        numero: "R-0001",
        nombre: "Carmen Huamán",
        vivienda: "Mz. C, lote 7",
        motivo: "Ya no tengo inquilino",
        fecha: "22 de setiembre de 2026",
        esSuyo: false,
        puedeRevisar: true,
      },
    ]);
    expect((await reclamosPorAtender(pedro)).items[0].puedeRevisar).toBe(false);
    await expect(reclamosPorAtender(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-04 CA1 el detalle muestra lo que pide, la cuota con su composición, el documento y los antecedentes", async () => {
    const archivo = await prisma.archivo.create({
      data: {
        clave: `comprobantes/${randomUUID()}.pdf`,
        tipo: "application/pdf",
        tamano: 1000,
        uso: USO_SUSTENTO_RECLAMO,
        subidoPor: carmen.usuarioId,
      },
    });
    const { reclamo } = await registrarReclamo(
      carmen,
      {
        motivo: "SIN_INQUILINO",
        detalle: "Se mudó en agosto",
        archivoId: archivo.id,
        idOperacion: randomUUID(),
      },
      RECLAMA,
    );
    expect(await verReclamoParaDecidir(marta, reclamo.id)).toMatchObject({
      numero: "R-0001",
      nombre: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      enviado: "22 de setiembre de 2026",
      motivo: "Ya no tengo inquilino",
      detalle: "Se mudó en agosto",
      documento: { id: archivo.id, tipo: "application/pdf" },
      cuotaActual: "S/ 5.00 por semana",
      antecedentes: {
        conceptos: "Casa S/ 2.50 + inquilino S/ 2.50",
        reclamosAnteriores: "Ninguno",
        pagos: "3 semanas pendientes",
      },
      opciones: [
        {
          valor: "APROBAR:inquilino",
          titulo: "Aprobar el ajuste",
          detalle: "Se quita el concepto inquilino: la cuota baja de S/ 5.00 a S/ 2.50 por semana",
        },
        {
          valor: "MANTENER",
          titulo: "Mantener la cuota de S/ 5.00",
          detalle: "Tendrá que explicar el motivo",
        },
      ],
      estado: "En revisión",
      puedeDecidir: true,
    });
    expect((await verReclamoParaDecidir(pedro, reclamo.id)).puedeDecidir).toBe(false);
    await expect(verReclamoParaDecidir(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-04 CA1 «ya pagué» solo se puede mantener: el pago se registra aparte", async () => {
    const id = await reclamoDeCarmen("YA_PAGUE");
    expect((await verReclamoParaDecidir(marta, id)).opciones.map((o) => o.valor)).toEqual(["MANTENER"]);
    await expect(decidir(id, "APROBAR:inquilino")).rejects.toThrow(/no corresponde a este reclamo/);
  });
});

describe("@HU-COB-04 CA2 Aprobar el ajuste", () => {
  it("@HU-COB-04 CA2 la deuda se recalcula: cada cuota baja lo que valía el concepto y vuelve a su estado", async () => {
    const id = await reclamoDeCarmen();
    const r = await decidir(id, "APROBAR:inquilino");
    expect(r).toMatchObject({
      aplicado: true,
      estado: "Aprobado",
      nombre: "Carmen Huamán",
      cuotaAhora: "S/ 2.50 por semana",
      debeAhora: 750,
    });
    expect((await cuotasDe("08123478")).map((c) => [c.estado, c.montoCalculado, c.saldoPendiente])).toEqual([
      ["VENCIDA", 250, 250],
      ["VENCIDA", 250, 250],
      ["PENDIENTE", 250, 250],
    ]);
    const filas = await prisma.reclamoCuota.findMany();
    expect(filas.map((f) => [f.montoAnterior, f.montoNuevo])).toEqual([
      [500, 250],
      [500, 250],
      [500, 250],
    ]);
    const cuota = (await miCuota(carmen))!;
    expect(cuota.debe).toBe(750);
    expect(cuota.reclamoEnRevision).toBeNull();
    expect(cuota.semanas.map((s) => s.estado)).toEqual(["Con retraso", "Con retraso", "Pendiente"]);
  });

  it("@HU-COB-04 CA2 el padrón se corrige y las cuotas que vienen ya no cobran al inquilino", async () => {
    const id = await reclamoDeCarmen();
    await decidir(id, "APROBAR:inquilino");
    const casa = await predioDe("08123478");
    expect((await prisma.predio.findUniqueOrThrow({ where: { id: casa } })).inquilinos).toBe(0);
    await calcularDeuda(LUNES_28);
    const nueva = (await cuotasDe("08123478")).at(-1)!;
    expect(nueva).toMatchObject({ montoCalculado: 250, saldoPendiente: 250 });
    const historial = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "actualizar_predio", entidadId: casa },
      orderBy: { fecha: "desc" },
    });
    expect(historial).toMatchObject({
      actorId: marta.usuarioId,
      antes: { inquilinos: 1 },
      despues: { inquilinos: 0 },
    });
  });

  it("@HU-COB-04 CA2 la casa recibe el nuevo importe y ve el reclamo aprobado", async () => {
    const id = await reclamoDeCarmen();
    await decidir(id, "APROBAR:inquilino");
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su reclamo fue aprobado" },
    });
    expect(aviso).toMatchObject({
      tipo: "PAGOS",
      texto:
        "Ajustamos su cuota: baja de S/ 5.00 a S/ 2.50 por semana. Lo que debe hoy es S/ 7.50. Gracias por avisarnos.",
    });
    expect(await verMiReclamo(carmen, id)).toMatchObject({
      estado: "Aprobado",
      respuesta: "La cuota baja de S/ 5.00 a S/ 2.50 por semana.",
    });
  });

  it("@HU-COB-04 AC-6 queda en la auditoría con quién decidió y qué", async () => {
    const id = await reclamoDeCarmen();
    await decidir(id, "APROBAR:inquilino");
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "aprobar_reclamo", entidadId: id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      antes: { cuota: "S/ 5.00 por semana" },
      despues: {
        reclamo: "R-0001",
        decision: "Aprobó el ajuste: quitó inquilino",
        cuota: "S/ 2.50 por semana",
      },
    });
    const reclamo = await prisma.solicitudAjusteTarifa.findUniqueOrThrow({ where: { id } });
    expect(reclamo).toMatchObject({
      estado: "APROBADO",
      decididoPorId: marta.usuarioId,
      conceptoAjustado: "inquilino",
    });
  });

  it("@HU-COB-04 una cuota que ya estaba pagada en parte puede quedar pagada del todo con el ajuste", async () => {
    const id = await reclamoDeCarmen();
    const [primera] = await cuotasDe("08123478");
    // Antes de que respondan, la casa ya había abonado 3.00 de esa semana.
    await prisma.cuota.update({ where: { id: primera.id }, data: { saldoPendiente: 200 } });
    await decidir(id, "APROBAR:inquilino");
    expect((await cuotasDe("08123478"))[0]).toMatchObject({
      estado: "PAGADA",
      montoCalculado: 250,
      saldoPendiente: 0,
    });
  });
});

describe("@HU-COB-04 CA3 Mantener la cuota", () => {
  it("@HU-COB-04 CA3 hay que explicar el motivo", async () => {
    const id = await reclamoDeCarmen();
    await expect(decidir(id, "MANTENER", " ")).rejects.toMatchObject({
      campos: { motivo: "Escriba el motivo para explicárselo a la casa." },
    });
    await expect(decidir(id, "")).rejects.toMatchObject({ campos: { decision: "Elija qué decide." } });
    await expect(decidir(id, "MANTENER", "a".repeat(301))).rejects.toBeInstanceOf(ErrorValidacion);
    expect((await prisma.solicitudAjusteTarifa.findUniqueOrThrow({ where: { id } })).estado).toBe(
      "EN_REVISION",
    );
  });

  it("@HU-COB-04 CA3 el importe original se ratifica, las cuotas vuelven a su estado y la casa recibe el motivo", async () => {
    const id = await reclamoDeCarmen();
    const r = await decidir(id, "MANTENER", "El contrato del inquilino sigue vigente.");
    expect(r).toMatchObject({
      aplicado: true,
      estado: "Se mantiene su cuota",
      cuotaAhora: "S/ 5.00 por semana",
      debeAhora: 1500,
    });
    expect((await cuotasDe("08123478")).map((c) => [c.estado, c.montoCalculado, c.saldoPendiente])).toEqual([
      ["VENCIDA", 500, 500],
      ["VENCIDA", 500, 500],
      ["PENDIENTE", 500, 500],
    ]);
    expect(
      (await prisma.predio.findUniqueOrThrow({ where: { id: await predioDe("08123478") } })).inquilinos,
    ).toBe(1);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: carmen.usuarioId, titulo: "Revisamos su reclamo" },
    });
    expect(aviso.texto).toBe(
      "Se mantiene su cuota de S/ 5.00 por semana. El contrato del inquilino sigue vigente. Si no está de acuerdo, converse con la directiva.",
    );
    expect(await verMiReclamo(carmen, id)).toMatchObject({
      estado: "Se mantiene su cuota",
      respuesta: "El contrato del inquilino sigue vigente.",
    });
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "mantener_cuota_por_reclamo", entidadId: id },
    });
    expect(auditoria.despues).toMatchObject({
      decision: "Mantuvo la cuota",
      motivo: "El contrato del inquilino sigue vigente.",
    });
  });

  it("@HU-COB-04 CA3 una vez respondido, la casa puede reclamar otra vez", async () => {
    const id = await reclamoDeCarmen();
    await decidir(id, "MANTENER", "El contrato sigue vigente.");
    expect(
      (
        await registrarReclamo(
          carmen,
          { motivo: "OTRO", detalle: "Quiero revisarlo", idOperacion: randomUUID() },
          RESPONDE,
        )
      ).creado,
    ).toBe(true);
  });
});

describe("@HU-COB-04 Reglas", () => {
  it("@HU-COB-04 AC-5 responder dos veces no cambia nada ni avisa otra vez; a la vez, tampoco", async () => {
    const id = await reclamoDeCarmen();
    const [a, b] = await Promise.all([decidir(id, "APROBAR:inquilino"), decidir(id, "APROBAR:inquilino")]);
    expect([a.aplicado, b.aplicado].sort()).toEqual([false, true]);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su reclamo fue aprobado" } })).toBe(1);
    expect(
      (await prisma.predio.findUniqueOrThrow({ where: { id: await predioDe("08123478") } })).inquilinos,
    ).toBe(0);
    expect((await decidir(id, "MANTENER", "Ya respondido.")).aplicado).toBe(false);
    expect((await cuotasDe("08123478"))[0].montoCalculado).toBe(250);
  });

  it("@HU-COB-04 solo la directiva responde: ni el mediador ni el vecino; y el reclamo tiene que existir", async () => {
    const id = await reclamoDeCarmen();
    await expect(decidir(id, "APROBAR:inquilino", undefined, pedro)).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    await expect(decidir(id, "APROBAR:inquilino", undefined, carmen)).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    await expect(decidir(randomUUID(), "MANTENER", "x")).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect((await prisma.solicitudAjusteTarifa.findUniqueOrThrow({ where: { id } })).estado).toBe(
      "EN_REVISION",
    );
  });

  it("@HU-COB-04 el reclamo de la casa de quien responde lo revisa otro miembro de la directiva", async () => {
    const id = await reclamoDeCarmen("SIN_INQUILINO", marta);
    expect((await reclamosPorAtender(marta)).items[0]).toMatchObject({ esSuyo: true, puedeRevisar: false });
    await expect(decidir(id, "MANTENER", "x")).rejects.toThrow(/lo revisa otro miembro/);
  });

  it("@HU-COB-04 el ajuste tiene que ser uno de los que ofrece el reclamo", async () => {
    const id = await reclamoDeCarmen();
    await expect(decidir(id, "APROBAR:auto")).rejects.toThrow(/no corresponde a este reclamo/);
    await expect(decidir(id, "APROBAR:casa")).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });
});

describe("@HU-COB-04 Endpoint", () => {
  const llamar = (token: string | null, id: string, cuerpo: unknown) =>
    decidirHttp(
      new Request(`http://localhost/api/aportes/ajustes/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: JSON.stringify(cuerpo),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("@HU-COB-04 PATCH /api/aportes/ajustes/{id} responde (200), repetirlo no cambia nada; 400, 401 y 403", async () => {
    const id = await reclamoDeCarmen();
    expect((await llamar(tokenMarta, id, { decision: "MANTENER" })).status).toBe(400);
    expect((await llamar(null, id, { decision: "MANTENER", motivo: "x" })).status).toBe(401);
    expect((await llamar(tokenAna, id, { decision: "MANTENER", motivo: "x" })).status).toBe(403);
    const respondido = await llamar(tokenMarta, id, { decision: "APROBAR:inquilino" });
    expect(respondido.status).toBe(200);
    expect(await respondido.json()).toMatchObject({ aplicado: true, estado: "Aprobado" });
    expect((await (await llamar(tokenMarta, id, { decision: "APROBAR:inquilino" })).json()).aplicado).toBe(
      false,
    );
  });
});
