import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { anonimizar, datosPersonales } from "@/modulos/aportes/aplicacion/datosPersonales";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { registrarReclamo } from "@/modulos/aportes/aplicacion/reclamos";
import { MEDIOS } from "@/modulos/aportes/dominio/pago";
import { resolverSolicitudArco, solicitarCancelacion } from "@/modulos/identidad/aplicacion/arco";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.setTimeout(30_000);

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const AHORA = new Date("2026-10-05T15:00:00Z");
const ANONIMO = "Persona anonimizada";
const TEXTO_BORRADO = "Texto eliminado por la cancelación de la cuenta.";

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let ana: SesionDto;
let casaCarmen: string;
let casaJulio: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

/** Un pago aprobado con su recibo: lo manda `autor`, lo registra `registra` y el recibo lleva el nombre `titular`. */
async function cobro(predioId: string, autor: SesionDto, titular: string, monto: number, registra = autor) {
  const pago = await prisma.pago.create({
    data: {
      idOperacion: randomUUID(),
      predioId,
      autorId: autor.usuarioId,
      medio: "YAPE_O_PLIN",
      monto,
      estado: "APROBADO",
      creadoEn: new Date("2026-09-02T17:00:00Z"),
    },
  });
  return prisma.recibo.create({
    data: {
      pagoId: pago.id,
      predioId,
      titular,
      vivienda: "Mz. X, lote 1",
      concepto: "Cuota de vigilancia",
      medio: MEDIOS.YAPE_O_PLIN,
      monto,
      fecha: new Date("2026-09-02T17:00:00Z"),
      registradoPor: registra.nombreCompleto,
      registradoPorId: registra.usuarioId,
    },
  });
}

const filas = async (usuarioId: string) =>
  Object.fromEntries((await datosPersonales(usuarioId)).flatMap((s) => s.filas ?? []));

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas, identidad_solicitudes_arco RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [carmen, julio, marta, ana] = await Promise.all(
    ["08123478", "40000006", "40000002", "40000001"].map(sesionDe),
  );
  [casaCarmen, casaJulio] = await Promise.all(["08123478", "40000006"].map(predioDe));
  for (const lunes of [LUNES_7, LUNES_14]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-12 La copia de mis datos incluye mis aportes", () => {
  it("@HU-GAR-12 CA1 trae la deuda de su casa, sus pagos, sus recibos, sus reclamos y sus pedidos, con sus propias palabras", async () => {
    const recibo = await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500);
    await registrarReclamo(
      carmen,
      { motivo: "OTRO", detalle: "Mi inquilino se mudó", idOperacion: randomUUID() },
      AHORA,
    );
    await prisma.pedidoCobroEnCasa.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaCarmen,
        solicitanteId: carmen.usuarioId,
        semanas: 2,
        monto: 1000,
        franja: "TARDE",
        nota: "Tocar el timbre",
        creadoEn: AHORA,
      },
    });
    await prisma.pedidoReciboPapel.create({
      data: {
        idOperacion: randomUUID(),
        reciboId: recibo.id,
        solicitanteId: carmen.usuarioId,
        franja: "MANANA",
        nota: "Dejarlo con la vecina",
        creadoEn: AHORA,
      },
    });
    const secciones = await datosPersonales(carmen.usuarioId);
    expect(secciones.map((s) => s.titulo)).toEqual(["Cuotas, pagos y recibos"]);
    expect(await filas(carmen.usuarioId)).toEqual({
      "Cuotas de su casa": "2 semanas pendientes · debe S/ 10.00",
      "Pago E-0001 del 2 de setiembre de 2026": "Yape o Plin · S/ 5.00 · Aprobado",
      "Recibo 000001 del 2 de setiembre de 2026": "S/ 5.00 · Cuota de vigilancia",
      "Reclamo R-0001 del 5 de octubre de 2026": "Otro motivo: «Mi inquilino se mudó» · En revisión",
      "Pedido de cobro en casa C-001 del 5 de octubre de 2026":
        "2 semanas · S/ 10.00 · Tarde, de 2:00 p. m. a 6:00 p. m. · Pendiente · nota: «Tocar el timbre»",
      "Pedido de recibo en papel R-001 del 5 de octubre de 2026":
        "Mañana, de 8:00 a. m. a 12:00 m. · Por entregar · nota: «Dejarlo con la vecina»",
    });
  });

  it("@HU-GAR-12 CA3 no trae nada de otra casa ni lo que la directiva cobró a otros", async () => {
    await cobro(casaJulio, julio, julio.nombreCompleto, 750);
    // Marta (directiva) registra el cobro de Carmen: es un recibo de Carmen, no de Marta.
    await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500, marta);
    const deMarta = await filas(marta.usuarioId);
    expect(Object.keys(deMarta).filter((k) => /^(Pago|Recibo)/.test(k))).toEqual([]);
    const deCarmen = await filas(carmen.usuarioId);
    expect(Object.values(deCarmen).join(" ")).not.toContain("7.50");
  });

  it("@HU-GAR-12 CA1 sin movimientos lo dice en llano", async () => {
    await prisma.$executeRaw`TRUNCATE aportes_cuota_conceptos, aportes_cuotas CASCADE`;
    expect(await filas(julio.usuarioId)).toEqual({ "Cuotas de su casa": "Sin cuotas emitidas" });
  });
});

describe("@HU-GAR-14 La cancelación anonimiza mis aportes", () => {
  it("@HU-GAR-14 CA3 conserva los registros contables y borra el nombre y lo que escribió la persona", async () => {
    const recibo = await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500);
    const { reclamo } = await registrarReclamo(
      carmen,
      { motivo: "OTRO", detalle: "Mi inquilino se mudó", idOperacion: randomUUID() },
      AHORA,
    );
    await prisma.pedidoCobroEnCasa.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaCarmen,
        solicitanteId: carmen.usuarioId,
        semanas: 2,
        monto: 1000,
        franja: "TARDE",
        nota: "Tocar el timbre",
        creadoEn: AHORA,
      },
    });
    await prisma.pedidoReciboPapel.create({
      data: {
        idOperacion: randomUUID(),
        reciboId: recibo.id,
        solicitanteId: carmen.usuarioId,
        franja: "MANANA",
        nota: "Dejarlo con la vecina",
        creadoEn: AHORA,
      },
    });
    const ajeno = await cobro(casaJulio, julio, julio.nombreCompleto, 750);

    await prisma.$transaction((tx) => anonimizar(carmen.usuarioId, tx));

    expect(await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } })).toMatchObject({
      titular: ANONIMO,
      monto: 500,
      numero: recibo.numero,
      registradoPor: ANONIMO,
    });
    expect(await prisma.pago.count({ where: { autorId: carmen.usuarioId } })).toBe(1);
    expect(await prisma.solicitudAjusteTarifa.findUniqueOrThrow({ where: { id: reclamo.id } })).toMatchObject(
      {
        detalle: TEXTO_BORRADO,
        motivo: "OTRO",
      },
    );
    expect((await prisma.pedidoCobroEnCasa.findFirstOrThrow()).nota).toBe(TEXTO_BORRADO);
    expect((await prisma.pedidoReciboPapel.findFirstOrThrow()).nota).toBe(TEXTO_BORRADO);
    // Lo de otra persona no se toca.
    expect(await prisma.recibo.findUniqueOrThrow({ where: { id: ajeno.id } })).toMatchObject({
      titular: julio.nombreCompleto,
    });
  });

  it("@HU-GAR-14 CA3 el recibo que cobró una persona que se va queda sin su nombre, y el de la vecina no cambia", async () => {
    const cobrado = await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500, marta);
    await prisma.$transaction((tx) => anonimizar(marta.usuarioId, tx));
    expect(await prisma.recibo.findUniqueOrThrow({ where: { id: cobrado.id } })).toMatchObject({
      titular: carmen.nombreCompleto,
      registradoPor: ANONIMO,
    });
  });

  it("@HU-GAR-14 CA3 el recibo sigue siendo inalterable: solo admite el nombre anonimizado", async () => {
    const recibo = await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500);
    await expect(prisma.recibo.update({ where: { id: recibo.id }, data: { monto: 1 } })).rejects.toThrow(
      /no se puede modificar/,
    );
    await expect(
      prisma.recibo.update({ where: { id: recibo.id }, data: { titular: "Otro nombre" } }),
    ).rejects.toThrow(/no se puede modificar/);
    await expect(
      prisma.recibo.update({ where: { id: recibo.id }, data: { titular: ANONIMO, concepto: "Otro" } }),
    ).rejects.toThrow(/no se puede modificar/);
    await expect(prisma.recibo.delete({ where: { id: recibo.id } })).rejects.toThrow(/no se puede borrar/);
  });

  it("@HU-GAR-14 CA3 aprobada la cancelación, la anonimización de aportes corre con la de identidad", async () => {
    const recibo = await cobro(casaCarmen, carmen, carmen.nombreCompleto, 500);
    const { id } = await solicitarCancelacion(carmen, { motivo: "MUDANZA" }, AHORA);
    await resolverSolicitudArco(ana, id, { aprobar: true }, AHORA, [anonimizar]);
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: carmen.usuarioId } })).nombreCompleto).toBe(
      ANONIMO,
    );
    expect((await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } })).titular).toBe(ANONIMO);
  });
});
