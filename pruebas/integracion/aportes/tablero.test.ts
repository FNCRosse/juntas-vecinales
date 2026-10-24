import { randomUUID } from "node:crypto";
import { GET as tableroHttp } from "@/app/api/aportes/tablero/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorValidacion } from "@/compartido/errores";
import { consultarTablero } from "@/modulos/aportes/aplicacion/tablero";
import { fechaLimiteDe, inicioDeSemana } from "@/modulos/aportes/dominio/cuota";
import { MEDIOS } from "@/modulos/aportes/dominio/pago";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.setTimeout(30_000);

// Domingo 27 de setiembre de 2026, 3:00 p. m. en Lima.
const AHORA = new Date("2026-09-27T20:00:00Z");
const lima = (dia: string, hora = "12:00") => new Date(`${dia}T${hora}:00-05:00`);

let marta: SesionDto;
let pedro: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let casaCarmen: string;
let casaJulio: string;
let casaMarta: string;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

/** Un cobro ya aprobado, con su recibo: lo que el tablero suma. */
async function cobro(
  predioId: string,
  medio: "YAPE_O_PLIN" | "TRANSFERENCIA" | "EFECTIVO",
  monto: number,
  fecha: Date,
) {
  const pago = await prisma.pago.create({
    data: { idOperacion: randomUUID(), predioId, autorId: marta.usuarioId, medio, monto, estado: "APROBADO" },
  });
  await prisma.recibo.create({
    data: {
      pagoId: pago.id,
      predioId,
      titular: "Titular de prueba",
      vivienda: "Mz. X, lote 1",
      concepto: "Cuota de vigilancia",
      medio: MEDIOS[medio],
      monto,
      fecha,
      registradoPor: marta.nombreCompleto,
      registradoPorId: marta.usuarioId,
    },
  });
  return pago;
}

/** Una cuota que la casa todavía debe, de la semana que empieza ese lunes. */
async function cuotaImpaga(predioId: string, lunes: string, saldo: number) {
  const tarifa = await prisma.tarifa.findFirstOrThrow();
  await prisma.cuota.create({
    data: {
      predioId,
      periodo: inicioDeSemana(lunes),
      fechaLimite: fechaLimiteDe(lunes),
      tarifaId: tarifa.id,
      montoCalculado: saldo,
      saldoPendiente: saldo,
      estado: "VENCIDA",
    },
  });
}

const llamar = (token: string | null, consulta = "desde=2026-09-01&hasta=2026-09-30") =>
  tableroHttp(
    new Request(`http://localhost/api/aportes/tablero?${consulta}`, {
      headers: token ? { cookie: `sesion=${token}` } : {},
    }),
    undefined,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [marta, pedro, carmen, julio] = await Promise.all(
    ["40000002", "40000003", "08123478", "40000006"].map(sesionDe),
  );
  [casaCarmen, casaJulio, casaMarta] = await Promise.all(["08123478", "40000006", "40000002"].map(predioDe));
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-13 CA1 Lo cobrado en el periodo", () => {
  beforeEach(async () => {
    await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
    await cobro(casaCarmen, "EFECTIVO", 250, lima("2026-09-08"));
    await cobro(casaJulio, "TRANSFERENCIA", 750, lima("2026-09-08", "00:00"));
    await cobro(casaMarta, "EFECTIVO", 1000, lima("2026-09-21"));
    // Fuera del periodo: no cuentan.
    await cobro(casaMarta, "YAPE_O_PLIN", 9999, lima("2026-08-31", "23:59"));
    await cobro(casaMarta, "YAPE_O_PLIN", 8888, lima("2026-10-01", "00:00"));
  });

  it("@HU-COB-13 CA1 suma los recibos digitales y en efectivo del periodo, y los cuenta", async () => {
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t).toMatchObject({
      seCobro: 2500,
      recibos: 4,
      digital: { monto: 1250, cantidad: 2 },
      efectivo: { monto: 1250, cantidad: 2 },
    });
  });

  it("@HU-COB-13 CA1 por semana de lunes a domingo en hora de Lima, con las semanas sin cobros", async () => {
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t.semanas.map((s) => [s.inicio, s.digital, s.efectivo, s.total])).toEqual([
      ["2026-08-31", 500, 0, 500],
      ["2026-09-07", 750, 250, 1000],
      ["2026-09-14", 0, 0, 0],
      ["2026-09-21", 0, 1000, 1000],
      ["2026-09-28", 0, 0, 0],
    ]);
  });

  it("@HU-COB-13 CA1 sin pedir nada mira el mes en curso hasta hoy", async () => {
    const t = await consultarTablero(marta, {}, AHORA);
    expect(t.periodo).toEqual({ desde: "2026-09-01", hasta: "2026-09-27" });
    expect(t.seCobro).toBe(2500);
  });

  it("@HU-COB-13 CA1 el mediador también lo ve; el vecino no", async () => {
    expect((await consultarTablero(pedro, {}, AHORA)).seCobro).toBe(2500);
    await expect(consultarTablero(carmen, {}, AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-13 CA1 lo que falta cobrar son las cuotas con saldo de las semanas del periodo", async () => {
    await cuotaImpaga(casaCarmen, "2026-09-07", 500);
    await cuotaImpaga(casaCarmen, "2026-09-14", 500);
    await cuotaImpaga(casaJulio, "2026-09-14", 250);
    await cuotaImpaga(casaJulio, "2026-08-24", 999);
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t.faltaCobrar).toEqual({ monto: 1250, cuotas: 3 });
  });
});

describe("@HU-COB-13 CA2 Filtros por estado y por fechas", () => {
  beforeEach(async () => {
    // Carmen debe una semana de julio (más de 8 semanas), Julio una de setiembre (2 semanas), Marta no debe nada.
    await cuotaImpaga(casaCarmen, "2026-07-06", 500);
    await cuotaImpaga(casaJulio, "2026-09-07", 250);
    await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
    await cobro(casaJulio, "EFECTIVO", 250, lima("2026-09-08"));
    await cobro(casaMarta, "YAPE_O_PLIN", 750, lima("2026-09-09"));
  });

  const por = (estado: string, desde = "2026-07-01", hasta = "2026-09-30") =>
    consultarTablero(marta, { desde, hasta, estado }, AHORA);

  it("@HU-COB-13 CA2 cuenta las casas por estado: al día, atraso de 1 a 7 semanas y 8 o más", async () => {
    const t = await por("TODAS");
    const total = (await prisma.predio.count({
      where: { residencias: { some: { fechaFin: null } } },
    })) as number;
    expect(t.casas).toEqual({ total, alDia: total - 2, atraso: 1, critico: 1 });
  });

  it("@HU-COB-13 CA2 filtra lo cobrado y lo que falta por el estado actual de la casa", async () => {
    expect(await por("TODAS")).toMatchObject({
      seCobro: 1500,
      recibos: 3,
      faltaCobrar: { monto: 750, cuotas: 2 },
    });
    expect(await por("CRITICO")).toMatchObject({
      seCobro: 500,
      recibos: 1,
      faltaCobrar: { monto: 500, cuotas: 1 },
    });
    expect(await por("ATRASO")).toMatchObject({
      seCobro: 250,
      recibos: 1,
      faltaCobrar: { monto: 250, cuotas: 1 },
    });
    expect(await por("AL_DIA")).toMatchObject({
      seCobro: 750,
      recibos: 1,
      faltaCobrar: { monto: 0, cuotas: 0 },
    });
  });

  it("@HU-COB-13 CA2 el filtro de estado no cambia cuántas casas hay en cada uno", async () => {
    expect((await por("CRITICO")).casas).toEqual((await por("TODAS")).casas);
  });

  it("@HU-COB-13 CA2 filtra por el rango de fechas: solo la semana del 7 al 13", async () => {
    const t = await por("TODAS", "2026-09-07", "2026-09-13");
    expect(t).toMatchObject({ seCobro: 1000, recibos: 2 });
    expect(t.semanas).toHaveLength(1);
  });

  it("@HU-COB-13 CA2 un reclamo en revisión no cuenta como atraso", async () => {
    await prisma.cuota.updateMany({ where: { predioId: casaCarmen }, data: { estado: "EN_DISCREPANCIA" } });
    expect((await por("CRITICO")).seCobro).toBe(0);
    expect((await por("AL_DIA")).seCobro).toBe(1250);
  });

  it("@HU-COB-13 CA2 pide datos válidos", async () => {
    await expect(por("MOROSOS")).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(por("TODAS", "2026-09-30", "2026-09-01")).rejects.toMatchObject({
      campos: { hasta: "La fecha final no puede ser antes de la inicial." },
    });
  });
});

describe("@HU-COB-13 CA3 Cuadra con los recibos", () => {
  it("@HU-COB-13 CA3 el total, la tabla por semana y los pagos aprobados dan lo mismo, al céntimo", async () => {
    for (const [i, monto] of [333, 667, 1001, 250, 4999, 1].entries()) {
      await cobro(
        i % 2 ? casaCarmen : casaJulio,
        i % 3 ? "YAPE_O_PLIN" : "EFECTIVO",
        monto,
        lima(`2026-09-0${i + 2}`),
      );
    }
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t.seCobro).toBe(7251);
    expect(t.cuadra).toEqual({ ok: true, recibos: 7251, semanas: 7251, pagos: 7251, pagosSinRecibo: 0 });
    expect(t.semanas.reduce((suma, s) => suma + s.total, 0)).toBe(t.seCobro);
    expect(t.digital.monto + t.efectivo.monto).toBe(t.seCobro);
  });

  it("@HU-COB-13 CA3 un pago aprobado que no tiene recibo hace que no cuadre y se vea", async () => {
    await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
    await prisma.pago.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaJulio,
        autorId: julio.usuarioId,
        medio: "EFECTIVO",
        monto: 250,
        estado: "APROBADO",
      },
    });
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t.cuadra).toMatchObject({ ok: false, recibos: 500, pagosSinRecibo: 1 });
  });

  it("@HU-COB-13 CA3 un recibo que no es de lo que se pagó tampoco cuadra", async () => {
    const pago = await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
    await prisma.pago.update({ where: { id: pago.id }, data: { monto: 400 } });
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t.cuadra).toMatchObject({ ok: false, recibos: 500, pagos: 400 });
  });

  it("@HU-COB-13 CA3 sin cobros todo es cero y cuadra", async () => {
    const t = await consultarTablero(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    expect(t).toMatchObject({ seCobro: 0, recibos: 0, cuadra: { ok: true } });
  });
});

describe("@HU-COB-13 Endpoint", () => {
  it("@HU-COB-13 GET /api/aportes/tablero responde (200) con el rango y el estado; 400, 401 y 403", async () => {
    await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
    const r = await llamar(tokenMarta, "desde=2026-09-01&hasta=2026-09-30&estado=TODAS");
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(await r.json()).toMatchObject({ seCobro: 500, recibos: 1, cuadra: { ok: true } });
    expect((await llamar(tokenMarta, "estado=MOROSOS")).status).toBe(400);
    expect((await llamar(null)).status).toBe(401);
    expect((await llamar(tokenAna)).status).toBe(403);
  });
});
