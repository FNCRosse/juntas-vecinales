import { randomUUID } from "node:crypto";
import { GET as exportarHttp } from "@/app/api/transparencia/exportar/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorValidacion } from "@/compartido/errores";
import { fechaLimiteDe, inicioDeSemana } from "@/modulos/aportes/dominio/cuota";
import { MEDIOS } from "@/modulos/aportes/dominio/pago";
import { exportarRecaudacion } from "@/modulos/transparencia/aplicacion/exportarRecaudacion";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.setTimeout(30_000);

// Domingo 27 de setiembre de 2026, 3:00 p. m. en Lima.
const AHORA = new Date("2026-09-27T20:00:00Z");
const lima = (dia: string, hora = "12:00") => new Date(`${dia}T${hora}:00-05:00`);

let marta: SesionDto;
let pedro: SesionDto;
let carmen: SesionDto;
let casaCarmen: string;
let casaJulio: string;
let casaMarta: string;
let tokenMarta: string;
let tokenPedro: string;
// La auditoría es de solo inserción y no se vacía entre pruebas: cada una mira lo que se registró desde que empezó.
let desde: Date;
const exportaciones = () =>
  prisma.registroAuditoria.findMany({
    where: { accion: "exportar_recaudacion", fecha: { gte: desde } },
    orderBy: { fecha: "asc" },
  });

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

async function cobro(predioId: string, medio: "YAPE_O_PLIN" | "EFECTIVO", monto: number, fecha: Date) {
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
}

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

const pedir = (token: string | null, consulta = "desde=2026-09-01&hasta=2026-09-30") =>
  exportarHttp(
    new Request(`http://localhost/api/transparencia/exportar?${consulta}`, {
      headers: token ? { cookie: `sesion=${token}` } : {},
    }),
    undefined,
  );
const filasDe = (archivo: string) => archivo.replace(/^﻿/, "").split("\r\n");

beforeEach(async () => {
  desde = new Date();
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas, aportes_ajuste_cuotas, aportes_ajustes RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [marta, pedro, carmen] = await Promise.all(["40000002", "40000003", "08123478"].map(sesionDe));
  [casaCarmen, casaJulio, casaMarta] = await Promise.all(["08123478", "40000006", "40000002"].map(predioDe));
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: "clave-de-prueba" }));
  // Carmen debe una semana de julio (8 semanas o más) y Julio una de setiembre (2 semanas); Marta está al día.
  await cuotaImpaga(casaCarmen, "2026-07-06", 500);
  await cuotaImpaga(casaJulio, "2026-09-07", 250);
  await cobro(casaCarmen, "YAPE_O_PLIN", 500, lima("2026-09-02"));
  await cobro(casaJulio, "EFECTIVO", 250, lima("2026-09-08"));
  await cobro(casaMarta, "YAPE_O_PLIN", 750, lima("2026-09-09"));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-15 CA1 CA2 Exportar la recaudación", () => {
  it("@HU-COB-15 CA2 el archivo trae los mismos totales y desgloses que el tablero", async () => {
    const { contenido, nombre } = await exportarRecaudacion(
      marta,
      { desde: "2026-07-01", hasta: "2026-09-30" },
      AHORA,
    );
    expect(nombre).toBe("recaudacion-2026-07-01-a-2026-09-30.csv");
    expect(contenido.startsWith("﻿")).toBe(true);
    const filas = filasDe(contenido);
    expect(filas).toEqual(
      expect.arrayContaining([
        "Periodo,2026-07-01 a 2026-09-30",
        "Estado de las casas,Todas las casas",
        "Total cobrado (S/),15.00",
        "Recibos emitidos,3",
        "Recibos digitales,2",
        "Monto digital (S/),12.50",
        "Recibos en efectivo,1",
        "Monto en efectivo (S/),2.50",
        "Falta cobrar (S/),7.50",
        "Cuotas por cobrar,2",
        "¿Cuadra?,Sí",
        "Total,12.50,2.50,15.00",
      ]),
    );
  });

  it("@HU-COB-15 CA2 trae el detalle por estado y por casa", async () => {
    const filas = filasDe(
      (await exportarRecaudacion(marta, { desde: "2026-07-01", hasta: "2026-09-30" }, AHORA)).contenido,
    );
    expect(filas).toContain("Atraso de 1 a 7 semanas,1,1,2.50,2.50");
    expect(filas).toContain("8 semanas o más,1,1,5.00,5.00");
    expect(filas).toContain('"Mz. C, lote 7",8 semanas o más,1,5.00,5.00');
    expect(filas).toContain('"Mz. A, lote 3",Atraso de 1 a 7 semanas,1,2.50,2.50');
    expect(filas).toContain('"Mz. A, lote 12",Al día,1,7.50,0.00');
  });

  it("@HU-COB-15 CA1 se puede filtrar por rango de fechas y por estado de las casas", async () => {
    const filas = filasDe(
      (
        await exportarRecaudacion(
          marta,
          { desde: "2026-09-08", hasta: "2026-09-30", estado: "CRITICO" },
          AHORA,
        )
      ).contenido,
    );
    expect(filas).toContain("Estado de las casas,8 semanas o más");
    expect(filas).toContain("Total cobrado (S/),0.00");
    expect(filas).toContain('"Mz. C, lote 7",8 semanas o más,0,0.00,0.00');
    expect(filas.some((f) => f.startsWith('"Mz. A, lote 3"'))).toBe(false);
  });

  it("@HU-COB-15 CA1 pide datos válidos", async () => {
    await expect(exportarRecaudacion(marta, { estado: "MOROSOS" }, AHORA)).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    await expect(
      exportarRecaudacion(marta, { desde: "2026-09-30", hasta: "2026-09-01" }, AHORA),
    ).rejects.toMatchObject({
      campos: { hasta: "La fecha final no puede ser antes de la inicial." },
    });
  });

  it("@HU-COB-15 solo la directiva exporta: ni el mediador ni el vecino", async () => {
    await expect(exportarRecaudacion(pedro, {}, AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(exportarRecaudacion(carmen, {}, AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect(await exportaciones()).toHaveLength(0);
  });
});

describe("@HU-COB-15 CA3 Queda en el historial de acciones", () => {
  it("@HU-COB-15 CA3 cada exportación deja quién la hizo, cuándo y qué pidió", async () => {
    await exportarRecaudacion(marta, { desde: "2026-09-01", hasta: "2026-09-30", estado: "ATRASO" }, AHORA);
    await exportarRecaudacion(marta, { desde: "2026-09-01", hasta: "2026-09-30" }, AHORA);
    const filas = await exportaciones();
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      actorId: marta.usuarioId,
      entidad: "Recaudacion",
      despues: { periodo: "2026-09-01 a 2026-09-30", estado: "Atraso de 1 a 7 semanas", formato: "CSV" },
    });
    expect(filas[1].despues).toMatchObject({ estado: "Todas las casas", recibos: 3, cobrado: "S/ 15.00" });
  });

  it("@HU-COB-15 CA3 una exportación que falla por datos inválidos no deja registro", async () => {
    await expect(exportarRecaudacion(marta, { estado: "MOROSOS" }, AHORA)).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    expect(await exportaciones()).toHaveLength(0);
  });
});

describe("@HU-COB-15 Endpoint", () => {
  it("@HU-COB-15 GET /api/transparencia/exportar descarga el CSV; 400, 401 y 403", async () => {
    const r = await pedir(tokenMarta, "desde=2026-09-01&hasta=2026-09-30");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(r.headers.get("content-disposition")).toBe(
      'attachment; filename="recaudacion-2026-09-01-a-2026-09-30.csv"',
    );
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes)).toContain(
      "Recaudación de la cuota de vigilancia",
    );
    expect((await pedir(tokenMarta, "estado=MOROSOS")).status).toBe(400);
    expect((await pedir(null)).status).toBe(401);
    expect((await pedir(tokenPedro)).status).toBe(403);
  });
});
