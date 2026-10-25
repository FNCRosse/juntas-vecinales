import { randomUUID } from "node:crypto";
import { PATCH as actualizarHttp } from "@/app/api/admin/padron/[predioId]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { cuotaDeHoy, tarifaDelPadron } from "@/modulos/aportes/aplicacion/cuotaDelPadron";
import { cambiarTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import { ocupacionDeLaCasa } from "@/modulos/identidad/aplicacion/comunidad";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.setTimeout(30_000);

// Miércoles 23 de setiembre de 2026, 10:00 a. m. en Lima: el siguiente ciclo empieza el lunes 28.
const AHORA = new Date("2026-09-23T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const LUNES_28 = new Date("2026-09-28T15:00:00Z");

let marta: SesionDto;
let carmen: SesionDto;
let tokenAna: string;
let casaCarmen: string;
let casaMarta: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

const SIN_CAMBIOS = {
  uso: "VIVIENDA",
  familias: 1,
  inquilinos: 1,
  autos: 0,
  motos: 0,
  triciclos: 0,
  negocios: 0,
};
const actualizar = (predioId: string, cuerpo: Record<string, unknown>, token = tokenAna) =>
  actualizarHttp(
    new Request(`http://localhost/api/admin/padron/${predioId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: `sesion=${token}` },
      body: JSON.stringify(cuerpo),
    }),
    { params: Promise.resolve({ predioId }) },
  );
const avisosDeCuota = (usuarioId: string) =>
  prisma.avisoEnCola.findMany({
    where: { destinatarioId: usuarioId, titulo: "Su cuota semanal va a cambiar" },
  });
const cuotasDe = async (predioId: string) =>
  (await prisma.cuota.findMany({ where: { predioId }, orderBy: { periodo: "asc" } })).map(
    (c) => c.montoCalculado,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [marta, carmen] = await Promise.all(["40000002", "08123478"].map(sesionDe));
  [casaCarmen, casaMarta] = await Promise.all(["08123478", "40000002"].map(predioDe));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-16 CA1 La tarifa que ve el padrón", () => {
  it("@HU-COB-16 CA1 son los conceptos de la tarifa del siguiente ciclo, y el lunes desde el que rigen", async () => {
    const t = await tarifaDelPadron(AHORA);
    expect(t.desde).toBe("Lunes 28 de setiembre de 2026");
    expect(t.conceptos.map((c) => [c.clave, c.nombre, c.monto])).toEqual(
      expect.arrayContaining([
        ["casa", "Casa", 250],
        ["inquilino", "Inquilino", 250],
        ["auto", expect.any(String), expect.any(Number)],
      ]),
    );
  });

  it("@HU-COB-16 CA1 un cambio programado para el siguiente lunes ya cuenta; uno para después, no", async () => {
    const sesionDirectiva = marta;
    await cambiarTarifa(
      sesionDirectiva,
      {
        concepto: "inquilino",
        monto: 300,
        vigencia: "2026-09-28",
        acta: "Acta de asamblea del 20 de setiembre de 2026",
        idOperacion: randomUUID(),
      },
      AHORA,
    );
    await cambiarTarifa(
      sesionDirectiva,
      {
        concepto: "casa",
        monto: 999,
        vigencia: "2026-10-05",
        acta: "Acta de asamblea del 20 de setiembre de 2026",
        idOperacion: randomUUID(),
      },
      AHORA,
    );
    const montos = Object.fromEntries(
      (await tarifaDelPadron(AHORA)).conceptos.map((c) => [c.clave, c.monto]),
    );
    expect(montos).toMatchObject({ inquilino: 300, casa: 250 });
  });

  it("@HU-COB-16 CA1 lo que paga hoy la casa es el monto de su última cuota", async () => {
    expect(await cuotaDeHoy(casaCarmen)).toBeNull();
    await calcularDeuda(LUNES_21);
    expect(await cuotaDeHoy(casaCarmen)).toBe(500);
    expect(await cuotaDeHoy(casaMarta)).toBe(250);
  });

  it("@HU-COB-16 CA1 la ocupación de la casa sale por clave de concepto", async () => {
    expect(await ocupacionDeLaCasa(casaCarmen)).toMatchObject({ casa: 1, inquilino: 1, auto: 0, moto: 0 });
    expect(await ocupacionDeLaCasa(randomUUID())).toBeNull();
  });
});

describe("@HU-GAR-10 CA2 La cuota se recalcula desde el siguiente ciclo", () => {
  it("@HU-GAR-10 CA2 al quitar al inquilino, la cuota de esta semana no cambia y la que viene baja; se avisa a la casa", async () => {
    await calcularDeuda(LUNES_21);
    const r = await actualizar(casaCarmen, { ...SIN_CAMBIOS, inquilinos: 0 });
    expect(r.status).toBe(200);
    expect(await cuotasDe(casaCarmen)).toEqual([500]);
    const [aviso, ...otros] = await avisosDeCuota(carmen.usuarioId);
    expect(otros).toEqual([]);
    // El endpoint usa la fecha de hoy: el lunes que dice es el siguiente a la fecha en que corre la prueba.
    expect(aviso.tipo).toBe("PAGOS");
    expect(aviso.texto).toMatch(
      /^Actualizamos los datos de su vivienda\. Desde el lunes \d{1,2} de [a-z]+ su cuota será de S\/ 2\.50 por semana\.$/,
    );
    await calcularDeuda(LUNES_28);
    expect(await cuotasDe(casaCarmen)).toEqual([500, 250]);
  });

  it("@HU-GAR-10 CA2 al agregar un auto, la cuota sube con lo que cuesta ese concepto y se avisa", async () => {
    await calcularDeuda(LUNES_21);
    await actualizar(casaCarmen, {
      ...SIN_CAMBIOS,
      autos: 1,
      placas: { autos: ["ABC-123"], motos: [] },
    });
    const [aviso] = await avisosDeCuota(carmen.usuarioId);
    const auto = (await tarifaDelPadron(AHORA)).conceptos.find((c) => c.clave === "auto")!;
    expect(aviso.texto).toContain(`S/ ${((500 + auto.monto) / 100).toFixed(2)} por semana`);
  });

  it("@HU-GAR-10 CA2 si el monto no cambia (otro dato del predio), no se avisa", async () => {
    await calcularDeuda(LUNES_21);
    const r = await actualizar(casaCarmen, { ...SIN_CAMBIOS, uso: "VIVIENDA_Y_NEGOCIO" });
    expect(r.status).toBe(200);
    expect(await avisosDeCuota(carmen.usuarioId)).toEqual([]);
  });

  it("@HU-GAR-10 CA2 si la casa todavía no tenía cuota, no hay nada que avisar", async () => {
    const r = await actualizar(casaCarmen, { ...SIN_CAMBIOS, inquilinos: 0 });
    expect(r.status).toBe(200);
    expect(await avisosDeCuota(carmen.usuarioId)).toEqual([]);
  });

  it("@HU-GAR-10 CA2 si el cambio no se guarda, tampoco se avisa; y solo lo hace el administrador", async () => {
    await calcularDeuda(LUNES_21);
    expect((await actualizar(casaCarmen, { ...SIN_CAMBIOS, inquilinos: 99 })).status).toBe(400);
    expect((await actualizar(casaCarmen, SIN_CAMBIOS)).status).toBe(422);
    expect(await avisosDeCuota(carmen.usuarioId)).toEqual([]);
    expect(await prisma.predio.findUniqueOrThrow({ where: { id: casaCarmen } })).toMatchObject({
      inquilinos: 1,
    });
  });

  it("@HU-GAR-10 CA3 queda en el historial con el cambio y quién lo hizo", async () => {
    await actualizar(casaCarmen, { ...SIN_CAMBIOS, inquilinos: 0 });
    const historial = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "actualizar_predio", entidadId: casaCarmen },
      orderBy: { fecha: "desc" },
    });
    expect(historial).toMatchObject({ antes: { inquilinos: 1 }, despues: { inquilinos: 0 } });
  });
});
