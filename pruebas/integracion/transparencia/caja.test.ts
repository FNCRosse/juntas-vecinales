import { randomUUID } from "node:crypto";
import { GET as balanceHttp } from "@/app/api/transparencia/balance-agregado/route";
import { GET as pdfHttp } from "@/app/api/transparencia/balance-agregado/pdf/route";
import { POST as movimientosHttp } from "@/app/api/transparencia/movimientos/route";
import { POST as rendicionesHttp } from "@/app/api/transparencia/rendiciones/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorConflicto,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { MEDIOS } from "@/modulos/aportes/dominio/pago";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  publicarRendicion,
  registrarMovimiento,
  rendicionDeCuentas,
} from "@/modulos/transparencia/aplicacion/caja";
import { cuentasDelBarrio } from "@/modulos/transparencia/aplicacion/cuentasDelBarrio";

jest.setTimeout(30_000);

// Domingo 27 de setiembre de 2026, 3:00 p. m. en Lima.
const AHORA = new Date("2026-09-27T20:00:00Z");
const lima = (dia: string, hora = "12:00") => new Date(`${dia}T${hora}:00-05:00`);

let marta: SesionDto;
let pedro: SesionDto;
let carmen: SesionDto;
let tokenMarta: string;
let tokenPedro: string;
let tokenAna: string;
let casaCarmen: string;
let comprobante: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const archivoDe = async (quien: SesionDto, uso = "comprobante_egreso") =>
  (
    await prisma.archivo.create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso,
        subidoPor: quien.usuarioId,
      },
    })
  ).id;

async function cobro(monto: number, fecha: Date) {
  const pago = await prisma.pago.create({
    data: {
      idOperacion: randomUUID(),
      predioId: casaCarmen,
      autorId: marta.usuarioId,
      medio: "EFECTIVO",
      monto,
      estado: "APROBADO",
    },
  });
  await prisma.recibo.create({
    data: {
      pagoId: pago.id,
      predioId: casaCarmen,
      titular: "Titular de prueba",
      vivienda: "Mz. X, lote 1",
      concepto: "Cuota de vigilancia",
      medio: MEDIOS.EFECTIVO,
      monto,
      fecha,
      registradoPor: marta.nombreCompleto,
      registradoPorId: marta.usuarioId,
    },
  });
}

const gasto = (cambios: Record<string, unknown> = {}) => ({
  tipo: "GASTO",
  monto: 15000,
  concepto: "MANTENIMIENTO",
  detalle: "Reja de la garita",
  fecha: "2026-09-18",
  archivoId: comprobante,
  idOperacion: randomUUID(),
  ...cambios,
});

const json = (token: string | null, url: string, cuerpo?: unknown) =>
  new Request(`http://localhost${url}`, {
    method: cuerpo === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_archivos, nucleo_cola_avisos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas, aportes_ajuste_cuotas, aportes_ajustes RESTART IDENTITY CASCADE`;
  // TRUNCATE no dispara los triggers de solo inserción: así se empieza de cero.
  await prisma.$executeRaw`TRUNCATE transparencia_movimientos_caja, transparencia_rendiciones`;
  await sembrar("clave-de-prueba");
  [marta, pedro, carmen] = await Promise.all(["40000002", "40000003", "08123478"].map(sesionDe));
  casaCarmen = (
    await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni: "08123478" }, fechaFin: null } })
  ).predioId;
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  comprobante = await archivoDe(marta);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-14 Registrar un ingreso o un gasto de la caja", () => {
  it("@HU-COB-14 la directiva registra un gasto con su comprobante y queda en la auditoría", async () => {
    const { movimiento, creado } = await registrarMovimiento(marta, gasto(), AHORA);
    expect(creado).toBe(true);
    expect(movimiento).toMatchObject({
      tipo: "GASTO",
      concepto: "Mantenimiento o reparación",
      detalle: "Reja de la garita",
      monto: 15000,
      fecha: "18 de setiembre de 2026",
      autor: "Marta Rojas",
      comprobanteId: comprobante,
    });
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_movimiento_caja", entidadId: movimiento.id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      despues: { tipo: "Gasto", concepto: "Mantenimiento o reparación", monto: "S/ 150.00" },
    });
  });

  it("@HU-COB-14 un ingreso no necesita comprobante y sin fecha es de hoy", async () => {
    const { movimiento } = await registrarMovimiento(
      marta,
      { tipo: "INGRESO", monto: 10000, concepto: "DONACION", idOperacion: randomUUID() },
      AHORA,
    );
    expect(movimiento).toMatchObject({
      tipo: "INGRESO",
      concepto: "Donación",
      fecha: "27 de setiembre de 2026",
      comprobanteId: null,
    });
  });

  it("@HU-COB-14 pide lo que falta: la foto del gasto, un comprobante propio, y una fecha que no sea futura", async () => {
    await expect(registrarMovimiento(marta, gasto({ archivoId: "" }), AHORA)).rejects.toMatchObject({
      campos: { archivoId: "Adjunte la foto del comprobante del gasto." },
    });
    const ajeno = await archivoDe(pedro);
    await expect(registrarMovimiento(marta, gasto({ archivoId: ajeno }), AHORA)).rejects.toMatchObject({
      campos: { archivoId: "Adjunte la foto del comprobante del gasto." },
    });
    const otroUso = await archivoDe(marta, "sustento_reclamo");
    await expect(registrarMovimiento(marta, gasto({ archivoId: otroUso }), AHORA)).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    await expect(registrarMovimiento(marta, gasto({ fecha: "2026-10-01" }), AHORA)).rejects.toMatchObject({
      campos: { fecha: "La fecha no puede ser futura." },
    });
    expect(await prisma.movimientoDeCaja.count()).toBe(0);
  });

  it("@HU-COB-14 AC-5 registrarlo dos veces no lo duplica, y otra persona no puede reusar el identificador", async () => {
    const datos = gasto();
    await registrarMovimiento(marta, datos, AHORA);
    const otra = await registrarMovimiento(marta, datos, AHORA);
    expect(otra.creado).toBe(false);
    expect(await prisma.movimientoDeCaja.count()).toBe(1);
    await expect(
      registrarMovimiento(
        { ...pedro, roles: ["DIRECTIVA"] },
        { ...datos, archivoId: await archivoDe(pedro) },
        AHORA,
      ),
    ).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const [a, b] = await Promise.all([
      registrarMovimiento(marta, gasto({ idOperacion: "mismo-pedido-0001" }), AHORA),
      registrarMovimiento(marta, gasto({ idOperacion: "mismo-pedido-0001" }), AHORA),
    ]).catch(() => [null, null]);
    expect(await prisma.movimientoDeCaja.count({ where: { idOperacion: "mismo-pedido-0001" } })).toBe(1);
    void a;
    void b;
  });

  it("@HU-COB-14 solo la directiva registra: ni el mediador ni el vecino", async () => {
    await expect(registrarMovimiento(pedro, gasto(), AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(registrarMovimiento(carmen, gasto(), AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-14 un movimiento registrado no se modifica ni se borra: un error se corrige con otro", async () => {
    const { movimiento } = await registrarMovimiento(marta, gasto(), AHORA);
    await expect(
      prisma.movimientoDeCaja.update({ where: { id: movimiento.id }, data: { monto: 1 } }),
    ).rejects.toThrow(/no se puede modificar ni borrar/);
    await expect(prisma.movimientoDeCaja.delete({ where: { id: movimiento.id } })).rejects.toThrow(
      /no se puede modificar ni borrar/,
    );
  });
});

describe("@HU-COB-14 La rendición de cuentas del mes", () => {
  beforeEach(async () => {
    await cobro(184000, lima("2026-09-10"));
    await cobro(9999, lima("2026-08-31", "23:59"));
    await registrarMovimiento(
      marta,
      gasto({ concepto: "VIGILANTES", monto: 140000, fecha: "2026-09-25", detalle: "Dos turnos" }),
      AHORA,
    );
    await registrarMovimiento(marta, gasto({ concepto: "MANTENIMIENTO", monto: 15000 }), AHORA);
    await registrarMovimiento(
      marta,
      gasto({ concepto: "MANTENIMIENTO", monto: 5000, fecha: "2026-09-20" }),
      AHORA,
    );
    await registrarMovimiento(
      marta,
      gasto({ concepto: "SERVICIOS", monto: 7000, fecha: "2026-08-30" }),
      AHORA,
    );
    await registrarMovimiento(
      marta,
      { tipo: "INGRESO", monto: 10000, concepto: "DONACION", fecha: "2026-09-12", idOperacion: randomUUID() },
      AHORA,
    );
  });

  it("@HU-COB-14 suma lo que entró (cuotas y otros ingresos), lo que se gastó y el saldo del mes", async () => {
    const r = await rendicionDeCuentas(marta, "2026-09", AHORA);
    expect(r).toMatchObject({
      mes: "2026-09",
      etiqueta: "Setiembre de 2026",
      ingresosPorCuotas: 184000,
      ingresosOtros: 10000,
      ingresos: 194000,
      gastos: 160000,
      saldo: 34000,
      comprobantes: 3,
      publicada: null,
    });
    expect(r.gastosPorConcepto).toEqual([
      { clave: "VIGILANTES", concepto: "Pago a vigilantes", monto: 140000 },
      { clave: "MANTENIMIENTO", concepto: "Mantenimiento o reparación", monto: 20000 },
    ]);
  });

  it("@HU-COB-14 lista los movimientos del mes del más nuevo al más antiguo, con su comprobante", async () => {
    const r = await rendicionDeCuentas(marta, "2026-09", AHORA);
    expect(r.movimientos.map((m) => [m.fecha, m.tipo, m.concepto, m.monto])).toEqual([
      ["25 de setiembre de 2026", "GASTO", "Pago a vigilantes", 140000],
      ["20 de setiembre de 2026", "GASTO", "Mantenimiento o reparación", 5000],
      ["18 de setiembre de 2026", "GASTO", "Mantenimiento o reparación", 15000],
      ["12 de setiembre de 2026", "INGRESO", "Donación", 10000],
    ]);
    expect(r.movimientos[0].comprobanteId).toBe(comprobante);
  });

  it("@HU-COB-14 otro mes trae lo suyo, y sin pedir nada mira el mes en curso", async () => {
    expect(await rendicionDeCuentas(marta, "2026-08", AHORA)).toMatchObject({
      ingresosPorCuotas: 9999,
      gastos: 7000,
    });
    expect((await rendicionDeCuentas(marta, undefined, AHORA)).mes).toBe("2026-09");
    expect((await rendicionDeCuentas(marta, "raro", AHORA)).mes).toBe("2026-09");
  });

  it("@HU-COB-14 la ven la directiva y el mediador; el vecino no", async () => {
    expect((await rendicionDeCuentas(pedro, "2026-09", AHORA)).gastos).toBe(160000);
    await expect(rendicionDeCuentas(carmen, "2026-09", AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-COB-14 Publicar la rendición", () => {
  beforeEach(async () => {
    await cobro(184000, lima("2026-09-10"));
    await registrarMovimiento(marta, gasto({ concepto: "VIGILANTES", monto: 140000 }), AHORA);
  });

  it("@HU-COB-14 publicar guarda los totales como estaban, queda en la auditoría y no se repite", async () => {
    const idOperacion = randomUUID();
    const { rendicion, creada } = await publicarRendicion(marta, { mes: "2026-09", idOperacion }, AHORA);
    expect(creada).toBe(true);
    expect(rendicion).toMatchObject({
      mes: "2026-09",
      ingresos: 184000,
      gastos: 140000,
      saldo: 44000,
      comprobantes: 1,
    });
    expect((await rendicionDeCuentas(marta, "2026-09", AHORA)).publicada).toMatchObject({
      por: "Marta Rojas",
    });
    expect((await publicarRendicion(marta, { mes: "2026-09", idOperacion }, AHORA)).creada).toBe(false);
    await expect(
      publicarRendicion(marta, { mes: "2026-09", idOperacion: randomUUID() }, AHORA),
    ).rejects.toBeInstanceOf(ErrorConflicto);
    expect(await prisma.rendicionPublicada.count()).toBe(1);
    expect(
      await prisma.registroAuditoria.count({
        where: {
          accion: "publicar_rendicion",
          entidadId: "2026-09",
          fecha: { gte: new Date(Date.now() - 60_000) },
        },
      }),
    ).toBeGreaterThanOrEqual(1);
  });

  it("@HU-COB-14 no se publica un mes sin nada, ni un mes que no existe; y solo la directiva publica", async () => {
    await expect(
      publicarRendicion(marta, { mes: "2026-07", idOperacion: randomUUID() }, AHORA),
    ).rejects.toBeInstanceOf(ErrorReglaNegocio);
    await expect(
      publicarRendicion(marta, { mes: "2026-13", idOperacion: randomUUID() }, AHORA),
    ).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(
      publicarRendicion(pedro, { mes: "2026-09", idOperacion: randomUUID() }, AHORA),
    ).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-14 después de publicarla no se puede modificar ni se agregan movimientos a ese mes", async () => {
    await publicarRendicion(marta, { mes: "2026-09", idOperacion: randomUUID() }, AHORA);
    await expect(registrarMovimiento(marta, gasto(), AHORA)).rejects.toBeInstanceOf(ErrorReglaNegocio);
    const fila = await prisma.rendicionPublicada.findFirstOrThrow();
    await expect(
      prisma.rendicionPublicada.update({ where: { id: fila.id }, data: { gastos: 1 } }),
    ).rejects.toThrow(/no se puede modificar ni borrar/);
    await expect(prisma.rendicionPublicada.delete({ where: { id: fila.id } })).rejects.toThrow(
      /no se puede modificar ni borrar/,
    );
    // Otro mes sigue abierto.
    await expect(registrarMovimiento(marta, gasto({ fecha: "2026-08-20" }), AHORA)).resolves.toMatchObject({
      creado: true,
    });
  });
});

describe("@HU-COB-14 CA1 CA2 CA3 Cuentas del barrio", () => {
  beforeEach(async () => {
    await cobro(184000, lima("2026-09-10"));
    await cobro(1000, lima("2026-09-21"));
    await registrarMovimiento(marta, gasto({ concepto: "VIGILANTES", monto: 140000 }), AHORA);
  });

  it("@HU-COB-14 CA1 el vecino ve lo que se juntó, lo que falta cobrar y lo que se juntó cada semana", async () => {
    const tarifa = await prisma.tarifa.findFirstOrThrow();
    await prisma.cuota.create({
      data: {
        predioId: casaCarmen,
        periodo: new Date("2026-09-07T05:00:00Z"),
        fechaLimite: new Date("2026-09-14T04:59:00Z"),
        tarifaId: tarifa.id,
        montoCalculado: 500,
        saldoPendiente: 500,
        estado: "VENCIDA",
      },
    });
    const c = await cuentasDelBarrio(carmen, "2026-09", AHORA);
    expect(c).toMatchObject({
      mes: "2026-09",
      etiqueta: "Setiembre de 2026",
      seJunto: 185000,
      faltaCobrar: { monto: 500, cuotas: 1 },
    });
    expect(c.semanas.reduce((suma, s) => suma + s.total, 0)).toBe(185000);
    expect(c.actualizado).toBe("21 de setiembre de 2026, 12:00 p. m.");
  });

  it("@HU-COB-14 CA1 los gastos aparecen cuando la directiva publica la rendición del mes, y solo por concepto", async () => {
    expect((await cuentasDelBarrio(carmen, "2026-09", AHORA)).gastos).toBeNull();
    await publicarRendicion(marta, { mes: "2026-09", idOperacion: randomUUID() }, AHORA);
    const c = await cuentasDelBarrio(carmen, "2026-09", AHORA);
    expect(c.gastos).toEqual({ total: 140000, detalle: [{ concepto: "Pago a vigilantes", monto: 140000 }] });
    expect(JSON.stringify(c)).not.toContain(comprobante);
  });

  it("@HU-COB-14 CA2 no trae nada de una casa ni de una persona", async () => {
    await publicarRendicion(marta, { mes: "2026-09", idOperacion: randomUUID() }, AHORA);
    const texto = JSON.stringify(await cuentasDelBarrio(carmen, "2026-09", AHORA));
    for (const dato of ["Mz.", "lote", "Carmen", "Huamán", "08123478", "Titular de prueba", "Marta"]) {
      expect(texto).not.toContain(dato);
    }
  });

  it("@HU-COB-14 CA3 se actualiza con cada pago que valida la directiva", async () => {
    const antes = await cuentasDelBarrio(carmen, "2026-09", AHORA);
    await cobro(2500, lima("2026-09-26", "09:00"));
    const despues = await cuentasDelBarrio(carmen, "2026-09", AHORA);
    expect(despues.seJunto).toBe(antes.seJunto + 2500);
    expect(despues.actualizado).toBe("26 de setiembre de 2026, 9:00 a. m.");
  });

  it("@HU-COB-14 todo vecino con sesión las ve, también la directiva; un mes raro es el mes en curso", async () => {
    expect((await cuentasDelBarrio(marta, "2026-09", AHORA)).seJunto).toBe(185000);
    expect((await cuentasDelBarrio(carmen, "raro", AHORA)).mes).toBe("2026-09");
    expect((await cuentasDelBarrio(carmen, undefined, AHORA)).meses.map((m) => m.valor)).toEqual([
      "2026-09",
      "2026-08",
      "2026-07",
    ]);
  });
});

describe("@HU-COB-14 Endpoints", () => {
  it("@HU-COB-14 POST /api/transparencia/movimientos registra (201), repetirlo da 200; 400, 401 y 403", async () => {
    const cuerpo = gasto();
    const nuevo = await movimientosHttp(
      json(tokenMarta, "/api/transparencia/movimientos", cuerpo),
      undefined,
    );
    expect(nuevo.status).toBe(201);
    expect(await nuevo.json()).toMatchObject({ tipo: "GASTO", monto: 15000 });
    expect(
      (await movimientosHttp(json(tokenMarta, "/api/transparencia/movimientos", cuerpo), undefined)).status,
    ).toBe(200);
    expect(
      (
        await movimientosHttp(
          json(tokenMarta, "/api/transparencia/movimientos", gasto({ archivoId: "" })),
          undefined,
        )
      ).status,
    ).toBe(400);
    expect(
      (await movimientosHttp(json(null, "/api/transparencia/movimientos", gasto()), undefined)).status,
    ).toBe(401);
    expect(
      (await movimientosHttp(json(tokenPedro, "/api/transparencia/movimientos", gasto()), undefined)).status,
    ).toBe(403);
  });

  it("@HU-COB-14 POST /api/transparencia/rendiciones publica (201), repetirlo da 200 y otra vez el mismo mes, 409", async () => {
    await cobro(1000, lima("2026-09-10"));
    const cuerpo = { mes: "2026-09", idOperacion: randomUUID() };
    expect(
      (await rendicionesHttp(json(tokenMarta, "/api/transparencia/rendiciones", cuerpo), undefined)).status,
    ).toBe(201);
    expect(
      (await rendicionesHttp(json(tokenMarta, "/api/transparencia/rendiciones", cuerpo), undefined)).status,
    ).toBe(200);
    expect(
      (
        await rendicionesHttp(
          json(tokenMarta, "/api/transparencia/rendiciones", { mes: "2026-09", idOperacion: randomUUID() }),
          undefined,
        )
      ).status,
    ).toBe(409);
    expect(
      (await rendicionesHttp(json(tokenPedro, "/api/transparencia/rendiciones", cuerpo), undefined)).status,
    ).toBe(403);
  });

  it("@HU-COB-14 GET /api/transparencia/balance-agregado lo ve todo el que tiene sesión; 401 sin ella; no se guarda en caché", async () => {
    await cobro(1000, lima("2026-09-10"));
    const r = await balanceHttp(
      json(tokenMarta, "/api/transparencia/balance-agregado?periodo=2026-09"),
      undefined,
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect(await r.json()).toMatchObject({ mes: "2026-09", seJunto: 1000 });
    expect((await balanceHttp(json(null, "/api/transparencia/balance-agregado"), undefined)).status).toBe(
      401,
    );
    expect((await balanceHttp(json(tokenAna, "/api/transparencia/balance-agregado"), undefined)).status).toBe(
      403,
    );
  });

  it("@HU-COB-14 GET /api/transparencia/balance-agregado/pdf baja las cuentas en PDF", async () => {
    await cobro(1000, lima("2026-09-10"));
    const r = await pdfHttp(
      json(tokenMarta, "/api/transparencia/balance-agregado/pdf?periodo=2026-09"),
      undefined,
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(
      Buffer.from(await r.arrayBuffer())
        .subarray(0, 5)
        .toString(),
    ).toBe("%PDF-");
  });
});
