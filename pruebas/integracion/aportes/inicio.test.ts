import { randomUUID } from "node:crypto";
import { GET as inicioHttp } from "@/app/api/portal/inicio/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { bandejaDeCobros, bloqueDeCuota } from "@/modulos/aportes/aplicacion/inicio";
import { alertarMorosidad, suspenderCasasConAtrasoCritico } from "@/modulos/aportes/aplicacion/morosidad";
import { registrarReclamo } from "@/modulos/aportes/aplicacion/reclamos";
import { fechaLimiteDe, inicioDeSemana } from "@/modulos/aportes/dominio/cuota";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.setTimeout(30_000);

const LUNES = [
  new Date("2026-09-07T15:00:00Z"),
  new Date("2026-09-14T15:00:00Z"),
  new Date("2026-09-21T15:00:00Z"),
];
const AHORA = new Date("2026-09-27T20:00:00Z");

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;
let casaCarmen: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;
const avisosDe = (destinatarioId: string, titulo: string) =>
  prisma.avisoEnCola.findMany({ where: { destinatarioId, titulo } });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_ajuste_cuotas, aportes_ajustes, aportes_alertas_preventivas, aportes_pedidos_cobro_en_casa, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  // Las semillas dejan a una casa ya suspendida para la garita: aquí todas parten con la reja abierta.
  await prisma.predio.updateMany({ data: { estadoGarita: "VERDE" } });
  [carmen, julio, marta, pedro] = await Promise.all(
    ["08123478", "40000006", "40000002", "40000003"].map(sesionDe),
  );
  casaCarmen = await predioDe("08123478");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-19 El bloque de cuota del inicio", () => {
  it("@HU-GAR-19 CA1 sin cuotas emitidas todavía, lo dice", async () => {
    expect(await bloqueDeCuota(carmen)).toEqual({
      porSemana: 0,
      debe: 0,
      semanas: 0,
      rango: null,
      estado: "SIN_CUOTAS",
      rejaSuspendida: false,
      reclamo: false,
    });
  });

  it("@HU-GAR-19 CA1 muestra lo que paga por semana, lo que debe y desde cuándo", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    expect(await bloqueDeCuota(carmen)).toEqual({
      porSemana: 500,
      debe: 1500,
      semanas: 3,
      rango: "3 semanas, del 7 al 27 de setiembre",
      estado: "PENDIENTE",
      rejaSuspendida: false,
      reclamo: false,
    });
  });

  it("@HU-GAR-19 CA3 cambia al pagar: una semana menos, y al día cuando no queda nada", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    const [primera, ...resto] = await prisma.cuota.findMany({
      where: { predioId: casaCarmen },
      orderBy: { periodo: "asc" },
    });
    await prisma.cuota.update({ where: { id: primera.id }, data: { saldoPendiente: 0, estado: "PAGADA" } });
    expect(await bloqueDeCuota(carmen)).toMatchObject({
      debe: 1000,
      semanas: 2,
      rango: "2 semanas, del 14 al 27 de setiembre",
    });
    await prisma.cuota.updateMany({
      where: { id: { in: resto.map((c) => c.id) } },
      data: { saldoPendiente: 0, estado: "PAGADA" },
    });
    expect(await bloqueDeCuota(carmen)).toMatchObject({
      debe: 0,
      semanas: 0,
      rango: null,
      estado: "AL_DIA",
      porSemana: 500,
    });
  });

  it("@HU-GAR-19 CA3 si todo lo pendiente ya está en un pago que la directiva revisa, dice «en revisión»", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    const cuotas = await prisma.cuota.findMany({ where: { predioId: casaCarmen } });
    await prisma.pago.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaCarmen,
        autorId: carmen.usuarioId,
        medio: "YAPE_O_PLIN",
        monto: 1500,
        cuotas: { create: cuotas.map((c) => ({ cuotaId: c.id, monto: c.saldoPendiente })) },
      },
    });
    expect(await bloqueDeCuota(carmen)).toMatchObject({ debe: 1500, estado: "EN_REVISION" });
  });

  it("@HU-GAR-19 CA1 avisa si la reja no se abre sola y si hay un reclamo en revisión", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    await prisma.predio.update({ where: { id: casaCarmen }, data: { estadoGarita: "ROJO" } });
    await registrarReclamo(carmen, { motivo: "SIN_INQUILINO", idOperacion: randomUUID() }, AHORA);
    expect(await bloqueDeCuota(carmen)).toMatchObject({ rejaSuspendida: true, reclamo: true });
  });

  it("@HU-GAR-19 AC-7 solo es de su casa y el panel de la API lo trae junto a los demás", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    const deMarta = await bloqueDeCuota(marta);
    expect(deMarta).toMatchObject({ porSemana: 250, debe: 750 });
    const respuesta = await inicioHttp(
      new Request("http://localhost/api/portal/inicio", { headers: { cookie: `sesion=${tokenMarta}` } }),
      undefined,
    );
    expect(Object.keys(await respuesta.json())).toEqual(["identidad", "reportes", "cuota"]);
  });
});

describe("@HU-GAR-19 La bandeja de cobros del resumen de la directiva", () => {
  it("@HU-GAR-19 DIR-INI-01 cuenta lo que espera a la directiva en cobros, y lo ve también el mediador", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    expect(await bandejaDeCobros(marta)).toEqual({
      comprobantes: 0,
      cobrosEnCasa: 0,
      reclamos: 0,
      recibosEnPapel: 0,
      total: 0,
    });
    const pago = await prisma.pago.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaCarmen,
        autorId: carmen.usuarioId,
        medio: "YAPE_O_PLIN",
        monto: 500,
      },
    });
    await prisma.comprobante.create({ data: { pagoId: pago.id, archivoId: randomUUID() } });
    await prisma.pedidoCobroEnCasa.create({
      data: {
        idOperacion: randomUUID(),
        predioId: casaCarmen,
        solicitanteId: carmen.usuarioId,
        semanas: 3,
        monto: 1500,
        franja: "TARDE",
      },
    });
    await registrarReclamo(carmen, { motivo: "SIN_INQUILINO", idOperacion: randomUUID() }, AHORA);
    const recibo = await prisma.recibo.create({
      data: {
        pagoId: (
          await prisma.pago.create({
            data: {
              idOperacion: randomUUID(),
              predioId: casaCarmen,
              autorId: carmen.usuarioId,
              medio: "EFECTIVO",
              monto: 500,
              estado: "APROBADO",
            },
          })
        ).id,
        predioId: casaCarmen,
        titular: carmen.nombreCompleto,
        vivienda: "Mz. C, lote 7",
        concepto: "Cuota de vigilancia",
        medio: "Efectivo",
        monto: 500,
        fecha: AHORA,
        registradoPor: marta.nombreCompleto,
        registradoPorId: marta.usuarioId,
      },
    });
    await prisma.pedidoReciboPapel.create({
      data: {
        idOperacion: randomUUID(),
        reciboId: recibo.id,
        solicitanteId: carmen.usuarioId,
        franja: "MANANA",
      },
    });
    const esperado = { comprobantes: 1, cobrosEnCasa: 1, reclamos: 1, recibosEnPapel: 1, total: 4 };
    expect(await bandejaDeCobros(marta)).toEqual(esperado);
    expect(await bandejaDeCobros(pedro)).toEqual(esperado);
    await expect(bandejaDeCobros(julio)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-COB-05 @HU-COB-06 Alertas del sistema para la directiva (DIR-INI-02)", () => {
  const DEPENDIENTES = ["40000002", "40000003"];

  it("@HU-COB-05 CA3 el worker deja un solo aviso a la directiva con cuántos recordatorios envió, sin recargos", async () => {
    for (const lunes of LUNES) await calcularDeuda(lunes);
    const { alertas } = await alertarMorosidad(AHORA);
    expect(alertas).toBeGreaterThan(0);
    for (const dni of DEPENDIENTES) {
      const [aviso, ...otros] = await avisosDe(
        (await sesionDe(dni)).usuarioId,
        "Recordatorios de cuota enviados",
      );
      expect(otros).toEqual([]);
      expect(aviso).toMatchObject({
        tipo: "PAGOS",
        texto: `Se enviaron ${alertas} recordatorios amables a casas con una semana de atraso. No se aplicó ningún recargo.`,
      });
    }
    // Correrla otra vez no envía nada y no repite el aviso.
    expect((await alertarMorosidad(AHORA)).alertas).toBe(0);
    expect(await avisosDe(marta.usuarioId, "Recordatorios de cuota enviados")).toHaveLength(1);
  });

  it("@HU-COB-06 CA3 el worker avisa a la directiva cuántas casas llegaron a 8 semanas sin pago", async () => {
    const tarifa = await prisma.tarifa.findFirstOrThrow();
    await prisma.cuota.create({
      data: {
        predioId: casaCarmen,
        periodo: inicioDeSemana("2026-07-06"),
        fechaLimite: fechaLimiteDe("2026-07-06"),
        tarifaId: tarifa.id,
        montoCalculado: 500,
        saldoPendiente: 500,
        estado: "VENCIDA",
      },
    });
    expect((await suspenderCasasConAtrasoCritico(AHORA)).suspendidas).toBe(1);
    for (const dni of DEPENDIENTES) {
      const [aviso, ...otros] = await avisosDe(
        (await sesionDe(dni)).usuarioId,
        "Casas con 8 semanas sin pago",
      );
      expect(otros).toEqual([]);
      expect(aviso).toMatchObject({
        tipo: "PAGOS",
        texto: "1 casa llegó a 8 semanas sin pago. La reja ya no se le abre sola y se le avisó.",
      });
    }
    expect((await suspenderCasasConAtrasoCritico(AHORA)).suspendidas).toBe(0);
    expect(await avisosDe(marta.usuarioId, "Casas con 8 semanas sin pago")).toHaveLength(1);
  });
});
